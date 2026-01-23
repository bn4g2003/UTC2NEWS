import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailQueueService } from './email-queue.service';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { EmailController } from './email.controller';
import { RBACModule } from '../rbac/rbac.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
    PrismaModule,
    RBACModule,
  ],
  controllers: [EmailController],
  providers: [EmailQueueService, EmailService, EmailProcessor],
  exports: [EmailQueueService, BullModule],
})
export class EmailModule {}
