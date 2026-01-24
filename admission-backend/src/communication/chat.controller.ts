import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @Post('rooms')
  async createRoom(@Body() createRoomDto: CreateRoomDto, @Request() req) {
    return this.chatService.createRoom(createRoomDto, req.user.userId);
  }

  @Get('rooms')
  async getUserRooms(@Request() req) {
    return this.chatService.getUserRooms(req.user.userId);
  }

  @Get('rooms/:roomId/messages')
  async getRoomMessages(
    @Param('roomId') roomId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
    @Request() req?,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getRoomMessages(
      roomId,
      req.user.userId,
      limitNum,
      before,
    );
  }

  @Get('channels/public')
  async getPublicChannels() {
    return this.chatService.getPublicChannels();
  }

  @Post('channels/:roomId/join')
  async joinChannel(@Param('roomId') roomId: string, @Request() req) {
    return this.chatService.joinChannel(roomId, req.user.userId);
  }

  @Post('rooms/members/add')
  async addMembers(@Body() addMemberDto: AddMemberDto, @Request() req) {
    return this.chatService.addMembers(
      addMemberDto.roomId,
      addMemberDto.userIds,
      req.user.userId,
    );
  }

  @Delete('rooms/members/remove')
  async removeMember(@Body() removeMemberDto: RemoveMemberDto, @Request() req) {
    return this.chatService.removeMember(
      removeMemberDto.roomId,
      removeMemberDto.userId,
      req.user.userId,
    );
  }

  @Get('presence/online')
  async getOnlineUsers() {
    return this.chatService.getOnlineUsers();
  }

  @Get('presence/:userId')
  async getUserPresence(@Param('userId') userId: string) {
    return this.chatService.getUserPresence(userId);
  }

  @Delete('messages/:id')
  async deleteMessage(@Param('id') id: string, @Request() req) {
    return this.chatService.deleteMessage(id, req.user.userId);
  }

  @Delete('rooms/:roomId')
  async deleteRoom(@Param('roomId') roomId: string, @Request() req) {
    return this.chatService.deleteRoom(roomId, req.user.userId);
  }
}
