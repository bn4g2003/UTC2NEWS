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
}
