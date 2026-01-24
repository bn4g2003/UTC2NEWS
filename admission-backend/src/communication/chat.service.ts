import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) { }

  async createRoom(createRoomDto: CreateRoomDto, creatorId: string) {
    const { name, type, participantIds, isPublic, description } = createRoomDto;

    // Validation
    if ((!participantIds || participantIds.length === 0) && type === 'DIRECT') {
      throw new Error('At least one participant is required for direct chat');
    }

    if (type === 'DIRECT' && participantIds.length !== 1) {
      throw new Error('Direct chat must have exactly one other participant');
    }

    if (type === 'GROUP' && participantIds.length < 1) {
      throw new Error('Group chat must have at least one other participant');
    }

    if (type === 'CHANNEL' && !name) {
      throw new Error('Channel must have a name');
    }

    // Kiểm tra nếu là DIRECT room và đã tồn tại
    if (type === 'DIRECT' && participantIds.length === 1) {
      const existingRoom = await this.findDirectRoom(
        creatorId,
        participantIds[0],
      );
      if (existingRoom) {
        return existingRoom;
      }
    }

    // Tạo room mới
    const allParticipantIds = type === 'CHANNEL' && isPublic
      ? [creatorId] // Channel công khai: chỉ thêm creator, người khác tự join
      : Array.from(new Set([creatorId, ...participantIds].filter(Boolean))); // Direct/Group: thêm tất cả, lọc trùng và falsy

    const room = await this.prisma.chatRoom.create({
      data: {
        name,
        type,
        isPublic: type === 'CHANNEL' ? isPublic : false,
        description,
        createdBy: creatorId,
        participants: {
          create: allParticipantIds.map((userId) => ({
            userId,
            role: userId === creatorId ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return room;
  }

  async findDirectRoom(userId1: string, userId2: string) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        type: 'DIRECT',
        AND: [
          {
            participants: {
              some: {
                userId: userId1,
              },
            },
          },
          {
            participants: {
              some: {
                userId: userId2,
              },
            },
          },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Tìm room có đúng 2 participants
    return rooms.find((room) => room.participants.length === 2);
  }

  async getUserRooms(userId: string) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Tính unread count cho mỗi room
    const roomsWithUnread = await Promise.all(
      rooms.map(async (room) => {
        const participant = room.participants.find((p) => p.userId === userId);
        const unreadCount = await this.prisma.message.count({
          where: {
            roomId: room.id,
            senderId: { not: userId },
            createdAt: {
              gt: participant?.lastReadAt || new Date(0),
            },
          },
        });

        return {
          ...room,
          unreadCount,
        };
      }),
    );

    return roomsWithUnread;
  }

  async sendMessage(sendMessageDto: SendMessageDto, senderId: string) {
    const { roomId, content, type, metadata } = sendMessageDto;

    // Kiểm tra user có trong room không
    const participant = await this.prisma.chatRoomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: senderId,
        },
      },
    });

    if (!participant) {
      throw new Error('User is not a participant of this room');
    }

    const message = await this.prisma.message.create({
      data: {
        roomId,
        senderId,
        content,
        type,
        metadata,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Update room updatedAt
    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async getRoomMessages(roomId: string, userId: string, limit = 50, before?: string) {
    // Kiểm tra user có trong room không
    const participant = await this.prisma.chatRoomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new Error('User is not a participant of this room');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
        // Remove deletedAt: null to include soft-deleted messages
        ...(before && {
          createdAt: {
            lt: new Date(before),
          },
        }),
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    // Scrub deleted messages content for privacy and format reactions
    const safeMessages = messages.map(msg => {
      const formattedReactions = msg.reactions.map(r => ({
        emoji: r.emoji,
        userId: r.user.id,
        userName: r.user.fullName,
      }));

      if (msg.deletedAt) {
        return {
          ...msg,
          content: 'Tin nhắn đã bị thu hồi',
          type: 'SYSTEM',
          metadata: null,
          isDeleted: true,
          reactions: formattedReactions,
        };
      }
      return {
        ...msg,
        reactions: formattedReactions,
      };
    });

    return safeMessages.reverse();
  }

  async getPinnedMessages(roomId: string, userId: string) {
    // Check participation
    const participant = await this.prisma.chatRoomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!participant) {
      throw new Error('User is not a participant of this room');
    }

    return this.prisma.message.findMany({
      where: {
        roomId,
        isPinned: true,
        deletedAt: null, // Don't show deleted pinned messages? Or show them as deleted? Usually unpin if deleted.
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async markAsRead(roomId: string, userId: string) {
    // Check if user is participant
    const participant = await this.prisma.chatRoomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (participant) {
      await this.prisma.chatRoomParticipant.update({
        where: {
          roomId_userId: {
            roomId,
            userId,
          },
        },
        data: {
          lastReadAt: new Date(),
        },
      });
    }
  }

  async updatePresence(userId: string, status: string, socketId?: string) {
    await this.prisma.userPresence.upsert({
      where: { userId },
      create: {
        userId,
        status,
        socketId,
        lastSeen: new Date(),
      },
      update: {
        status,
        socketId,
        lastSeen: new Date(),
      },
    });
  }

  async getUserPresence(userId: string) {
    return this.prisma.userPresence.findUnique({
      where: { userId },
    });
  }

  async getOnlineUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.prisma.userPresence.findMany({
      where: {
        status: 'online',
        lastSeen: {
          gte: fiveMinutesAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  // Lấy tất cả channels công khai
  async getPublicChannels() {
    return this.prisma.chatRoom.findMany({
      where: {
        type: 'CHANNEL',
        isPublic: true,
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Join channel công khai
  async joinChannel(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new Error('Channel not found');
    }

    if (room.type !== 'CHANNEL') {
      throw new Error('Only channels can be joined');
    }

    if (!room.isPublic) {
      throw new Error('This channel is private');
    }

    // Kiểm tra đã join chưa
    const existing = await this.prisma.chatRoomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (existing) {
      throw new Error('Already a member of this channel');
    }

    // Thêm vào channel
    await this.prisma.chatRoomParticipant.create({
      data: {
        roomId,
        userId,
        role: 'MEMBER',
      },
    });

    return this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // Thêm members vào group/channel (chỉ admin)
  async addMembers(roomId: string, userIds: string[], requesterId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: true,
      },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.type === 'DIRECT') {
      throw new Error('Cannot add members to direct chat');
    }

    // Kiểm tra quyền admin
    const requester = room.participants.find((p) => p.userId === requesterId);
    if (!requester || requester.role !== 'ADMIN') {
      throw new Error('Only admins can add members');
    }

    // Thêm members
    const newMembers = await Promise.all(
      userIds.map(async (userId) => {
        // Kiểm tra đã là member chưa
        const existing = await this.prisma.chatRoomParticipant.findUnique({
          where: {
            roomId_userId: {
              roomId,
              userId,
            },
          },
        });

        if (existing) {
          return null;
        }

        return this.prisma.chatRoomParticipant.create({
          data: {
            roomId,
            userId,
            role: 'MEMBER',
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        });
      }),
    );

    return newMembers.filter(Boolean);
  }

  // Xóa member khỏi group/channel (chỉ admin)
  async removeMember(roomId: string, userId: string, requesterId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: true,
      },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    if (room.type === 'DIRECT') {
      throw new Error('Cannot remove members from direct chat');
    }

    // Kiểm tra quyền admin (hoặc tự rời)
    const requester = room.participants.find((p) => p.userId === requesterId);
    if (requesterId !== userId && (!requester || requester.role !== 'ADMIN')) {
      throw new Error('Only admins can remove members');
    }

    await this.prisma.chatRoomParticipant.delete({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    return { success: true };
  }
  // Xóa tin nhắn
  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        room: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    const participant = message.room.participants.find((p) => p.userId === userId);
    const isAdmin = participant?.role === 'ADMIN';
    const isSender = message.senderId === userId;

    if (!isSender && !isAdmin) {
      throw new Error('You can only delete your own messages or you must be an admin');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }
  async deleteRoom(roomId: string, userId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        participants: true,
      },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    const participant = room.participants.find((p) => p.userId === userId);

    // Chỉ cho phép admin xóa room
    if (!participant || participant.role !== 'ADMIN') {
      throw new Error('Only admins can delete this room');
    }

    // Xóa tất cả messages trước (để tránh lỗi message orphan nếu không có cascade)
    // Tuy nhiên Prisma usually handles cascade, but nice to be explicit or let DB handle it.
    // Assuming DB has ON DELETE CASCADE. If not, we might need to delete messages.
    // Let's assume cascade is set up or delete messages manually just in case.
    await this.prisma.message.deleteMany({
      where: { roomId },
    });

    await this.prisma.chatRoomParticipant.deleteMany({
      where: { roomId },
    });

    await this.prisma.chatRoom.delete({
      where: { id: roomId },
    });

    return { success: true, id: roomId };
  }

  async pinMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        room: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    const participant = message.room.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new Error('You are not a participant of this room');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isPinned: true },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async unpinMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        room: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    const participant = message.room.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new Error('You are not a participant of this room');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isPinned: false },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  // Add reaction to message
  async addReaction(messageId: string, userId: string, emoji: string) {
    // Check if message exists and user has access
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        room: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    const participant = message.room.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new Error('You are not a participant of this room');
    }

    // Create or update reaction
    const reaction = await this.prisma.messageReaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
      create: {
        messageId,
        userId,
        emoji,
      },
      update: {},
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return {
      messageId,
      emoji,
      userId: reaction.user.id,
      userName: reaction.user.fullName,
    };
  }

  // Remove reaction from message
  async removeReaction(messageId: string, userId: string, emoji: string) {
    try {
      await this.prisma.messageReaction.delete({
        where: {
          messageId_userId_emoji: {
            messageId,
            userId,
            emoji,
          },
        },
      });

      return { success: true, messageId, emoji };
    } catch (error) {
      // Reaction doesn't exist, that's fine
      return { success: true, messageId, emoji };
    }
  }
}
