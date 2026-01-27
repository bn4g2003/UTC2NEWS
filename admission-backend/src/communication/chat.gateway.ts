import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { TypingIndicatorDto } from './dto/typing-indicator.dto';
import { randomUUID } from 'crypto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.data.userId = userId;
      this.userSockets.set(userId, client.id);

      // Update presence
      await this.chatService.updatePresence(userId, 'online', client.id);

      // Join user's rooms
      const rooms = await this.chatService.getUserRooms(userId);
      rooms.forEach((room) => {
        client.join(`room:${room.id}`);
      });

      // Notify others about online status
      this.server.emit('user:online', { userId });

      console.log(`User ${userId} connected with socket ${client.id}`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
      await this.chatService.updatePresence(userId, 'offline');
      this.server.emit('user:offline', { userId });
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      const userId = client.data.userId;

      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      if (!data.content || !data.content.trim()) {
        return { success: false, error: 'Message content is required' };
      }

      const message = await this.chatService.sendMessage(data, userId);

      // Emit to all users in the room
      this.server.to(`room:${data.roomId}`).emit('message:new', message);

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message || 'Failed to send message' };
    }
  }

  @SubscribeMessage('room:create')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateRoomDto,
  ) {
    try {
      const userId = client.data.userId;

      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      // Ensure participantIds is valid array
      const roomData = {
        ...data,
        participantIds: data.participantIds || []
      };

      const room = await this.chatService.createRoom(roomData, userId);

      // Join all participants to the room (if they are online)
      if (room && room.participants) {
        room.participants.forEach((participant) => {
          try {
            const socketId = this.userSockets.get(participant.userId);
            if (socketId) {
              // Use modern Socket.IO v4 API to make socket join room
              this.server.in(socketId).socketsJoin(`room:${room.id}`);
            }
          } catch (e) {
            console.warn(`Failed to join socket for user ${participant.userId}`, e);
          }
        });
      }

      // Notify all participants
      this.server.to(`room:${room.id}`).emit('room:created', room);

      return { success: true, room };
    } catch (error) {
      console.error('Error creating room:', error);
      return { success: false, error: error.message || 'Failed to create room' };
    }
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      client.join(`room:${data.roomId}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingIndicatorDto,
  ) {
    const userId = client.data.userId;
    client.to(`room:${data.roomId}`).emit('typing:user', {
      roomId: data.roomId,
      userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TypingIndicatorDto,
  ) {
    const userId = client.data.userId;
    client.to(`room:${data.roomId}`).emit('typing:user', {
      roomId: data.roomId,
      userId,
      isTyping: false,
    });
  }

  @SubscribeMessage('message:read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    try {
      const userId = client.data.userId;

      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      if (!data.roomId) {
        return { success: false, error: 'Room ID is required' };
      }

      await this.chatService.markAsRead(data.roomId, userId);

      // Notify other participants in the room
      client.to(`room:${data.roomId}`).emit('message:read', {
        roomId: data.roomId,
        userId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking as read:', error);
      return { success: false, error: error.message || 'Failed to mark as read' };
    }
  }

  @SubscribeMessage('message:pin')
  async handlePinMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) return { success: false, error: 'User not authenticated' };

      const message = await this.chatService.pinMessage(data.messageId, userId);

      // Emit to all in room
      this.server.to(`room:${message.roomId}`).emit('message:updated', message);

      return { success: true, message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('message:unpin')
  async handleUnpinMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) return { success: false, error: 'User not authenticated' };

      const message = await this.chatService.unpinMessage(data.messageId, userId);

      // Emit to all in room
      this.server.to(`room:${message.roomId}`).emit('message:updated', message);

      return { success: true, message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('message:react')
  async handleAddReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; emoji: string },
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) return { success: false, error: 'User not authenticated' };

      const reaction = await this.chatService.addReaction(
        data.messageId,
        userId,
        data.emoji,
      );

      // Get full message with all reactions
      const message = await this.chatService['prisma'].message.findUnique({
        where: { id: data.messageId },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              username: true,
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

      if (message) {
        // Transform reactions to match frontend format
        const transformedMessage = {
          ...message,
          reactions: message.reactions.map(r => ({
            emoji: r.emoji,
            userId: r.userId,
            userName: r.user.fullName,
          })),
        };

        // Emit to all in room with full message
        this.server.to(`room:${message.roomId}`).emit('message:reaction:added', {
          messageId: data.messageId,
          reaction,
          message: transformedMessage,
        });
      }

      return { success: true, reaction };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('message:unreact')
  async handleRemoveReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string; emoji: string },
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) return { success: false, error: 'User not authenticated' };

      const result = await this.chatService.removeReaction(
        data.messageId,
        userId,
        data.emoji,
      );

      // Get full message with all reactions
      const message = await this.chatService['prisma'].message.findUnique({
        where: { id: data.messageId },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              username: true,
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

      if (message) {
        // Transform reactions to match frontend format
        const transformedMessage = {
          ...message,
          reactions: message.reactions.map(r => ({
            emoji: r.emoji,
            userId: r.userId,
            userName: r.user.fullName,
          })),
        };

        // Emit to all in room with full message
        this.server.to(`room:${message.roomId}`).emit('message:reaction:removed', {
          messageId: data.messageId,
          emoji: data.emoji,
          userId,
          message: transformedMessage,
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // --- Video Call Signaling ---

  @SubscribeMessage('call:initiate')
  async handleInitiateCall(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; roomName: string; type: 'DIRECT' | 'GROUP'; hmsRoomId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { success: false, error: 'User not authenticated' };

    const callerInfo = await this.chatService['prisma'].user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, username: true },
    });

    // Notify all participants in the chat room except the caller
    client.to(`room:${data.roomId}`).emit('call:invitation', {
      ...data,
      caller: callerInfo,
      callId: randomUUID(),
    });

    return { success: true };
  }

  @SubscribeMessage('call:response')
  async handleCallResponse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; callId: string; accept: boolean; hmsRoomId?: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { success: false, error: 'User not authenticated' };

    // Notify others in the chat room about the caller response
    this.server.to(`room:${data.roomId}`).emit('call:status', {
      ...data,
      userId,
    });

    return { success: true };
  }

  @SubscribeMessage('call:end')
  async handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; callId: string },
  ) {
    this.server.to(`room:${data.roomId}`).emit('call:ended', {
      ...data,
      userId: client.data.userId,
    });

    return { success: true };
  }
}
