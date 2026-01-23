import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { EmailStatus } from '@prisma/client';

export interface AdmissionEmailData {
  studentName: string;
  majorName: string;
  admissionMethod: string;
  finalScore: number;
  preference: number;
}

export interface EmailJob {
  id: string;
  studentId: string;
  email: string;
  templateData: AdmissionEmailData;
}

@Injectable()
export class EmailQueueService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async queueAdmissionEmails(sessionId: string): Promise<void> {
    // Get all admitted students for the session
    const admittedApplications = await this.prisma.application.findMany({
      where: {
        sessionId,
        admissionStatus: 'admitted',
      },
      include: {
        student: true,
        major: true,
      },
    });

    // Create email notification records and queue jobs
    for (const application of admittedApplications) {
      const { student, major } = application;

      if (!student.email) {
        console.warn(
          `Student ${student.id} does not have an email address. Skipping.`,
        );
        continue;
      }

      const templateData: AdmissionEmailData = {
        studentName: student.fullName,
        majorName: major.name,
        admissionMethod: application.admissionMethod,
        finalScore: application.calculatedScore
          ? parseFloat(application.calculatedScore.toString())
          : 0,
        preference: application.preferencePriority,
      };

      // Create email notification record in database
      const emailNotification = await this.prisma.emailNotification.create({
        data: {
          studentId: student.id,
          email: student.email,
          templateName: 'admission-result',
          templateData: templateData as any,
          status: EmailStatus.pending,
          attempts: 0,
        },
      });

      // Add job to BullMQ queue
      await this.emailQueue.add(
        'send-admission-email',
        {
          id: emailNotification.id,
          studentId: student.id,
          email: student.email,
          templateData,
        } as EmailJob,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000, // Start with 2 seconds
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    }
  }

  async getEmailStatus(studentId: string): Promise<{
    sent: boolean;
    sentAt: Date | null;
    attempts: number;
    lastError: string | null;
    status: EmailStatus;
  } | null> {
    const notification = await this.prisma.emailNotification.findFirst({
      where: {
        studentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!notification) {
      return null;
    }

    return {
      sent: notification.status === EmailStatus.sent,
      sentAt: notification.sentAt,
      attempts: notification.attempts,
      lastError: notification.lastError,
      status: notification.status,
    };
  }
}
