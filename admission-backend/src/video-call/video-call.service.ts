import { Injectable, Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

@Injectable()
export class VideoCallService {
    private readonly logger = new Logger(VideoCallService.name);
    private readonly accessKey: string;
    private readonly secret: string;

    constructor() {
        this.accessKey = (process.env.HMS_ACCESS_KEY || '').trim();
        this.secret = (process.env.HMS_SECRET || '').trim();

        if (!this.accessKey || !this.secret) {
            this.logger.warn('HMS credentials are not fully configured in environment variables');
        }
    }

    /**
     * Generates a client-side token for joining a 100ms room
     */
    generateToken(roomId: string, userId: string, role: string = 'host'): string {
        const iat = Math.floor(Date.now() / 1000) - 120; // 2 minutes offset
        return jwt.sign(
            {
                access_key: this.accessKey,
                room_id: roomId,
                user_id: userId,
                role: role,
                type: 'app',
                version: 2,
                iat: iat,
            },
            this.secret,
            {
                algorithm: 'HS256',
                expiresIn: '24h',
                jwtid: randomUUID(),
            },
        );
    }

    /**
     * Generates a management token for administrative tasks (creating rooms, etc.)
     */
    generateManagementToken(): string {
        const iat = Math.floor(Date.now() / 1000) - 120; // 2 minutes offset
        return jwt.sign(
            {
                access_key: this.accessKey,
                type: 'management',
                version: 2,
                iat: iat,
            },
            this.secret,
            {
                algorithm: 'HS256',
                expiresIn: '24h',
                jwtid: randomUUID(),
            },
        );
    }

    /**
     * Create a room in 100ms dashboard via API
     */
    async createRoom(name: string, description: string = ''): Promise<any> {
        try {
            const token = this.generateManagementToken();
            const response = await fetch('https://api.100ms.live/v2/rooms', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name.replace(/[^a-zA-Z0-9_-]/g, '-'), // 100ms room names must be alphanumeric/-/_
                    description: description,
                    template_id: process.env.HMS_TEMPLATE_ID || '',
                    enabled: true,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                this.logger.error('100ms API Error Body: ' + JSON.stringify(error));
                throw new Error(error.message || `100ms API responded with ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            this.logger.error(`Error creating 100ms room: ${error.message}`, error.stack);
            throw error;
        }
    }
}
