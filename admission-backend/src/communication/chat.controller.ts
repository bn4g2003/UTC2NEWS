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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { CmsService } from '../cms/cms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { RemoveMemberDto } from './dto/remove-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatGateway } from './chat.gateway';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly cmsService: CmsService,
    @Inject(ChatGateway) private readonly chatGateway: ChatGateway,
  ) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Reuse CMS service upload logic
    return this.cmsService.uploadMediaFile(file, req.user.userId);
  }

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

  @Get('rooms/:roomId/pinned')
  async getPinnedMessages(@Param('roomId') roomId: string, @Request() req) {
    return this.chatService.getPinnedMessages(roomId, req.user.userId);
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
    const deletedMessage = await this.chatService.deleteMessage(id, req.user.userId);
    
    // Emit WebSocket event to notify all users in the room
    if (deletedMessage && this.chatGateway.server) {
      // Transform to match frontend format - no reactions for deleted messages
      const transformedMessage = {
        ...deletedMessage,
        content: 'Tin nhắn đã bị thu hồi',
        type: 'SYSTEM',
        metadata: null,
        isDeleted: true,
        reactions: [], // Empty reactions array
      };
      
      this.chatGateway.server
        .to(`room:${deletedMessage.roomId}`)
        .emit('message:deleted', transformedMessage);
    }
    
    return deletedMessage;
  }

  @Delete('rooms/:roomId')
  async deleteRoom(@Param('roomId') roomId: string, @Request() req) {
    return this.chatService.deleteRoom(roomId, req.user.userId);
  }
}
