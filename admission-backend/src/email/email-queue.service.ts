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
  isAdmitted: boolean; // New field to distinguish admitted vs not admitted
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
    // Get all students in the session with their applications
    const students = await this.prisma.student.findMany({
      where: {
        sessionId,
        email: {
          not: null,
        },
      },
      include: {
        applications: {
          where: {
            sessionId,
          },
          include: {
            major: true,
          },
          orderBy: {
            preferencePriority: 'asc',
          },
        },
      },
    });

    // Create email notification records and queue jobs
    for (const student of students) {
      if (!student.email || student.applications.length === 0) {
        console.warn(
          `Student ${student.id} does not have an email address or applications. Skipping.`,
        );
        continue;
      }

      // Check if student is admitted
      const admittedApplication = student.applications.find(
        app => app.admissionStatus === 'admitted'
      );

      let templateData: AdmissionEmailData;

      if (admittedApplication) {
        // Student is admitted - use admitted application data
        templateData = {
          studentName: student.fullName,
          majorName: admittedApplication.major.name,
          admissionMethod: admittedApplication.admissionMethod,
          finalScore: admittedApplication.calculatedScore
            ? parseFloat(admittedApplication.calculatedScore.toString())
            : 0,
          preference: admittedApplication.preferencePriority,
          isAdmitted: true,
        };
      } else {
        // Student is not admitted - use first preference data
        const firstPreference = student.applications[0];
        templateData = {
          studentName: student.fullName,
          majorName: firstPreference.major.name,
          admissionMethod: firstPreference.admissionMethod,
          finalScore: firstPreference.calculatedScore
            ? parseFloat(firstPreference.calculatedScore.toString())
            : 0,
          preference: firstPreference.preferencePriority,
          isAdmitted: false,
        };
      }

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

  async getRecipientCount(sessionId: string): Promise<{
    count: number;
    admitted: number;
    notAdmitted: number;
  }> {
    // Count all students with applications in this session who have email addresses
    const allStudents = await this.prisma.student.findMany({
      where: {
        sessionId,
        email: {
          not: null,
        },
      },
      include: {
        applications: {
          where: {
            sessionId,
          },
        },
      },
    });

    // Count admitted students
    const admitted = allStudents.filter(student => 
      student.applications.some(app => app.admissionStatus === 'admitted')
    ).length;

    // Count not admitted students (have applications but none admitted)
    const notAdmitted = allStudents.filter(student => 
      student.applications.length > 0 && 
      !student.applications.some(app => app.admissionStatus === 'admitted')
    ).length;

    const count = allStudents.length;

    return {
      count,
      admitted,
      notAdmitted,
    };
  }
}
