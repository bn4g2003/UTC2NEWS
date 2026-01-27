import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
import { VideoCallService } from './video-call.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('video')
@UseGuards(JwtAuthGuard)
export class VideoCallController {
    constructor(
        private readonly videoCallService: VideoCallService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('rooms')
    async createRoom(@Body() data: { name: string; description?: string }, @Request() req) {
        const room = await this.videoCallService.createRoom(data.name, data.description);

        // Check if video session already exists for this room
        const existingSession = await this.prisma.videoSession.findUnique({
            where: { roomId: room.id },
        });

        if (existingSession) {
            // Return existing session instead of creating duplicate
            return {
                id: existingSession.id,
                hmsRoomId: room.id,
                title: existingSession.title,
            };
        }

        // Save to our database
        const videoSession = await this.prisma.videoSession.create({
            data: {
                roomId: room.id,
                title: data.name,
                hostId: req.user.userId,
                status: 'SCHEDULED',
            },
        });

        return {
            id: videoSession.id,
            hmsRoomId: room.id,
            title: videoSession.title,
        };
    }

    @Post('token')
    async getToken(@Body() data: { roomId: string }, @Request() req) {
        const token = this.videoCallService.generateToken(data.roomId, req.user.userId);
        return { token };
    }

    @Get('sessions/:id')
    async getSession(@Param('id') id: string) {
        return this.prisma.videoSession.findUnique({
            where: { id },
            include: {
                host: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
    }
}
