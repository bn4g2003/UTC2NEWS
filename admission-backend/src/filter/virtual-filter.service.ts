import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreCalculationService } from '../score/score-calculation.service';
import { FilterResult, AdmissionDecision } from './dto/filter-result.dto';
import { RankedApplication } from './dto/ranked-application.dto';
import { Prisma, AdmissionStatus } from '@prisma/client';

/**
 * Service for implementing the virtual filtering algorithm
 * Processes student applications by preference priority and score ranking
 */
@Injectable()
export class VirtualFilterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoreCalculationService: ScoreCalculationService,
  ) {}

  /**
   * Main entry point for running the virtual filter algorithm
   * @param sessionId - The admission session ID to process
   * @returns FilterResult with execution summary
   */
  async runFilter(sessionId: string): Promise<FilterResult> {
    const startTime = Date.now();

    // Verify session exists
    const session = await this.prisma.admissionSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Admission session ${sessionId} not found`);
    }

    // Use transaction for atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Step 1: Calculate scores for all applications
      await this.calculateScores(sessionId, tx);

      // Step 2: Rank applications by score within each major
      const rankedApplications = await this.rankApplications(sessionId, tx);

      // Step 3: Process preferences and make admission decisions
      const decisions = await this.processPreferences(
        sessionId,
        rankedApplications,
        tx,
      );

      // Step 4: Persist admission decisions
      await this.persistDecisions(decisions, tx);

      return decisions;
    });

    const executionTime = Date.now() - startTime;

    // Count unique students
    const uniqueStudents = new Set(result.map((d) => d.studentId));
    const admittedCount = result.filter((d) => d.status === 'admitted').length;

    return {
      sessionId,
      totalStudents: uniqueStudents.size,
      admittedCount,
      executionTime,
      decisions: result,
    };
  }

  /**
   * Calculate scores for all applications in a session
   * @param sessionId - The admission session ID
   * @param tx - Prisma transaction client
   */
  async calculateScores(
    sessionId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    // Get all applications for this session
    const applications = await tx.application.findMany({
      where: { sessionId },
      include: {
        student: true,
      },
    });

    // Calculate score for each application
    for (const application of applications) {
      const subjectScores = application.subjectScores as Record<
        string,
        number
      >;
      const priorityPoints = Number(application.student.priorityPoints);

      // Calculate score
      const calculatedScore = this.scoreCalculationService.calculateScore(
        subjectScores,
        priorityPoints,
        application.admissionMethod,
      );

      // Check eligibility
      const isEligible = this.scoreCalculationService.isEligible(
        subjectScores,
        application.admissionMethod,
      );

      // Update application with calculated score
      await tx.application.update({
        where: { id: application.id },
        data: {
          calculatedScore,
          admissionStatus: isEligible
            ? AdmissionStatus.pending
            : AdmissionStatus.not_admitted,
        },
      });
    }
  }

  /**
   * Rank applications by score within each major
   * @param sessionId - The admission session ID
   * @param tx - Prisma transaction client
   * @returns Array of ranked applications
   */
  async rankApplications(
    sessionId: string,
    tx: Prisma.TransactionClient,
  ): Promise<RankedApplication[]> {
    // Get all eligible applications (not already marked as not_admitted)
    const applications = await tx.application.findMany({
      where: {
        sessionId,
        admissionStatus: {
          not: AdmissionStatus.not_admitted,
        },
        calculatedScore: {
          not: null,
        },
      },
      orderBy: [
        { majorId: 'asc' },
        { admissionMethod: 'asc' },
        { calculatedScore: 'desc' },
      ],
    });

    // Group by major and admission method, then assign ranks
    const rankedApplications: RankedApplication[] = [];
    let currentMajor = '';
    let currentMethod = '';
    let currentRank = 0;

    for (const app of applications) {
      const majorMethodKey = `${app.majorId}-${app.admissionMethod}`;
      const prevKey = `${currentMajor}-${currentMethod}`;

      // Reset rank when we move to a new major-method combination
      if (majorMethodKey !== prevKey) {
        currentRank = 1;
        currentMajor = app.majorId;
        currentMethod = app.admissionMethod;
      } else {
        currentRank++;
      }

      rankedApplications.push({
        applicationId: app.id,
        studentId: app.studentId,
        majorId: app.majorId,
        admissionMethod: app.admissionMethod,
        priority: app.preferencePriority,
        calculatedScore: Number(app.calculatedScore),
        rank: currentRank,
      });

      // Update rank in database
      await tx.application.update({
        where: { id: app.id },
        data: { rankInMajor: currentRank },
      });
    }

    return rankedApplications;
  }

  /**
   * Process preferences in priority order and make admission decisions
   * @param sessionId - The admission session ID
   * @param rankedApps - Array of ranked applications
   * @param tx - Prisma transaction client
   * @returns Array of admission decisions
   */
  async processPreferences(
    sessionId: string,
    rankedApps: RankedApplication[],
    tx: Prisma.TransactionClient,
  ): Promise<AdmissionDecision[]> {
    const decisions: AdmissionDecision[] = [];
    const admittedStudents = new Set<string>();

    // Get quotas for this session
    const quotas = await tx.sessionQuota.findMany({
      where: { sessionId },
    });

    // Create quota tracking map: majorId-admissionMethod -> remaining quota
    const quotaMap = new Map<string, number>();
    for (const quota of quotas) {
      const key = `${quota.majorId}-${quota.admissionMethod}`;
      quotaMap.set(key, quota.quota);
    }

    // Get maximum preference priority
    const maxPriority = Math.max(...rankedApps.map((app) => app.priority));

    // Process each preference level (NV1, NV2, NV3, ...)
    for (let priority = 1; priority <= maxPriority; priority++) {
      // Get applications for this preference level
      const preferenceApps = rankedApps
        .filter((app) => app.priority === priority)
        .sort((a, b) => {
          // Sort by major, then by rank (score)
          if (a.majorId !== b.majorId) {
            return a.majorId.localeCompare(b.majorId);
          }
          return a.rank - b.rank;
        });

      // Process each application in rank order
      for (const app of preferenceApps) {
        // Skip if student already admitted
        if (admittedStudents.has(app.studentId)) {
          continue;
        }

        const quotaKey = `${app.majorId}-${app.admissionMethod}`;
        const remainingQuota = quotaMap.get(quotaKey) || 0;

        if (remainingQuota > 0) {
          // Admit student
          decisions.push({
            applicationId: app.applicationId,
            studentId: app.studentId,
            majorId: app.majorId,
            status: 'admitted',
            admittedPreference: priority,
          });

          // Mark student as admitted
          admittedStudents.add(app.studentId);

          // Decrease quota
          quotaMap.set(quotaKey, remainingQuota - 1);

          // Remove student from all lower priority preferences
          const lowerPriorityApps = rankedApps.filter(
            (a) => a.studentId === app.studentId && a.priority > priority,
          );

          for (const lowerApp of lowerPriorityApps) {
            decisions.push({
              applicationId: lowerApp.applicationId,
              studentId: lowerApp.studentId,
              majorId: lowerApp.majorId,
              status: 'not_admitted',
              admittedPreference: null,
            });
          }
        } else {
          // Quota reached, mark as not admitted
          decisions.push({
            applicationId: app.applicationId,
            studentId: app.studentId,
            majorId: app.majorId,
            status: 'not_admitted',
            admittedPreference: null,
          });
        }
      }
    }

    return decisions;
  }

  /**
   * Persist admission decisions to the database
   * @param decisions - Array of admission decisions
   * @param tx - Prisma transaction client
   */
  private async persistDecisions(
    decisions: AdmissionDecision[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    for (const decision of decisions) {
      await tx.application.update({
        where: { id: decision.applicationId },
        data: {
          admissionStatus:
            decision.status === 'admitted'
              ? AdmissionStatus.admitted
              : AdmissionStatus.not_admitted,
        },
      });
    }
  }
}
