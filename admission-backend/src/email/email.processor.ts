import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { EmailJob } from './email-queue.service';
import { EmailStatus } from '@prisma/client';

@Processor('email')
export class EmailProcessor {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  @Process('send-admission-email')
  async processEmailJob(job: Job<EmailJob>): Promise<void> {
    const { id, email, templateData } = job.data;

    try {
      // Update status to processing
      await this.prisma.emailNotification.update({
        where: { id },
        data: {
          status: EmailStatus.processing,
          attempts: job.attemptsMade + 1,
        },
      });

      // Send the email
      await this.emailService.sendAdmissionResultEmail(email, templateData);

      // Update status to sent
      await this.prisma.emailNotification.update({
        where: { id },
        data: {
          status: EmailStatus.sent,
          sentAt: new Date(),
          lastError: null,
        },
      });

      console.log(`Email sent successfully to ${email} (notification ID: ${id})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update attempts count
      await this.prisma.emailNotification.update({
        where: { id },
        data: {
          attempts: job.attemptsMade + 1,
          lastError: errorMessage,
        },
      });

      // If this is the last attempt, mark as failed
      if (job.attemptsMade + 1 >= 3) {
        await this.prisma.emailNotification.update({
          where: { id },
          data: {
            status: EmailStatus.failed,
          },
        });

        console.error(
          `Email failed after all retries to ${email} (notification ID: ${id}): ${errorMessage}`,
        );
      } else {
        console.warn(
          `Email attempt ${job.attemptsMade + 1} failed to ${email} (notification ID: ${id}): ${errorMessage}. Will retry.`,
        );
      }

      // Re-throw the error so Bull knows the job failed and should retry
      throw error;
    }
  }
}
