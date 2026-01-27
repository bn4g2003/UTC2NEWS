import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScoreCalculationService } from '../score/score-calculation.service';
import { FilterResult, AdmissionDecision, RejectionReason } from './dto/filter-result.dto';
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
  ) { }

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
      const eligibilityReasons = await this.calculateScores(sessionId, tx);

      // Step 2: Rank applications by score within each major
      const rankedApplications = await this.rankApplications(sessionId, tx);

      // Step 3: Process preferences and make admission decisions
      const decisions = await this.processPreferences(
        sessionId,
        rankedApplications,
        eligibilityReasons,
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
   * @returns Map of applicationId -> rejection reason (for ineligible apps)
   */
  async calculateScores(
    sessionId: string,
    tx: Prisma.TransactionClient,
  ): Promise<Map<string, RejectionReason>> {
    const rejectionReasons = new Map<string, RejectionReason>();

    // Get session with all quotas first to avoid redundant fetching
    const session = await tx.admissionSession.findUnique({
      where: { id: sessionId },
      include: {
        quotas: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Admission session ${sessionId} not found`);
    }

    // Create quota map for quick lookup: majorId -> quota
    const quotaMap = new Map<string, any>();
    for (const quota of session.quotas) {
      quotaMap.set(quota.majorId, quota);
    }

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

      const quota = quotaMap.get(application.majorId);
      const conditions = quota?.conditions as any;
      const formulaId = quota?.formulaId;

      if (!formulaId) {
        // If no formula defined for this major in this session, we can't calculate score
        rejectionReasons.set(application.id, 'not_eligible_basic');
        continue;
      }

      // Check quota-specific conditions (min scores, required subjects)
      let isEligible = this.scoreCalculationService.isEligibleForQuota(
        subjectScores,
        conditions,
      );

      // Track rejection reason
      if (!isEligible) {
        rejectionReasons.set(application.id, 'not_eligible_quota');
      }

      // Calculate score with dynamic formula
      let calculatedScore = isEligible
        ? await this.scoreCalculationService.calculateDynamicScore(
          subjectScores,
          priorityPoints,
          formulaId,
        )
        : 0;

      // Check minTotalScore (Điểm sàn) condition
      if (isEligible && conditions?.minTotalScore) {
        if (calculatedScore < conditions.minTotalScore) {
          console.log(`[Filter Debug] App ${application.id}: Score ${calculatedScore} < MinTotalScore ${conditions.minTotalScore}. Result: FAILED (Below Floor)`);
          isEligible = false;
          rejectionReasons.set(application.id, 'not_eligible_quota');
          // calculatedScore = 0; // Commented out to see the actual score in DB/Results for debugging
        } else {
          console.log(`[Filter Debug] App ${application.id}: Score ${calculatedScore} >= MinTotalScore ${conditions.minTotalScore}. Result: PASSED Floor`);
        }
      } else {
        if (isEligible) console.log(`[Filter Debug] App ${application.id}: Score ${calculatedScore}. PASSED (No Floor Check)`);
      }

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

    return rejectionReasons;
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
        { calculatedScore: 'desc' },
      ],
    });

    // Group by major and assign ranks
    const rankedApplications: RankedApplication[] = [];
    let currentMajor = '';
    let currentRank = 0;

    for (const app of applications) {
      // Reset rank when we move to a new major
      if (app.majorId !== currentMajor) {
        currentRank = 1;
        currentMajor = app.majorId;
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
   */
  async processPreferences(
    sessionId: string,
    rankedApps: RankedApplication[],
    eligibilityReasons: Map<string, RejectionReason>,
    tx: Prisma.TransactionClient,
  ): Promise<AdmissionDecision[]> {
    // 1. Get quotas for this session
    const quotas = await tx.sessionQuota.findMany({
      where: { sessionId },
    });

    const quotaMap = new Map<string, number>();
    for (const quota of quotas) {
      quotaMap.set(quota.majorId, quota.quota);
    }

    // 2. Get all applications to return complete results
    const allApplications = await tx.application.findMany({
      where: { sessionId },
      include: {
        major: true,
      },
    });

    // Create a map for quick lookup
    const appMap = new Map(allApplications.map(app => [app.id, app]));

    // 3. Track rejection status for each application
    let activeApps = rankedApps.map(app => ({ ...app, isRejected: false }));
    let changed = true;

    // 4. Iterative Stable Matching
    while (changed) {
      changed = false;
      const majorProposals = new Map<string, typeof activeApps>();
      const studentBestApp = new Map<string, number>();

      for (const app of activeApps) {
        if (app.isRejected) continue;
        const currentBest = studentBestApp.get(app.studentId);
        if (currentBest === undefined || app.priority < currentBest) {
          studentBestApp.set(app.studentId, app.priority);
        }
      }

      for (const app of activeApps) {
        if (app.isRejected) continue;
        const bestPriority = studentBestApp.get(app.studentId);
        if (bestPriority !== undefined && app.priority === bestPriority) {
          let majorQueue = majorProposals.get(app.majorId);
          if (!majorQueue) {
            majorQueue = [];
            majorProposals.set(app.majorId, majorQueue);
          }
          majorQueue.push(app);
        }
      }

      for (const [majorId, proposals] of majorProposals.entries()) {
        const quota = quotaMap.get(majorId) || 0;

        if (proposals.length > quota) {
          proposals.sort((a, b) => {
            if (b.calculatedScore !== a.calculatedScore) {
              return b.calculatedScore - a.calculatedScore;
            }
            return a.studentId.localeCompare(b.studentId);
          });

          for (let i = quota; i < proposals.length; i++) {
            const rejectedApp = proposals[i];
            const appToMark = activeApps.find(a => a.applicationId === rejectedApp.applicationId);
            if (appToMark && !appToMark.isRejected) {
              appToMark.isRejected = true;
              changed = true;
            }
          }
        }
      }
    }

    // 5. Final decisions
    const decisions: AdmissionDecision[] = [];
    const studentFinalBest = new Map<string, number>();
    for (const app of activeApps) {
      if (!app.isRejected) {
        const currentBest = studentFinalBest.get(app.studentId);
        if (currentBest === undefined || app.priority < currentBest) {
          studentFinalBest.set(app.studentId, app.priority);
        }
      }
    }

    for (const application of allApplications) {
      const app = appMap.get(application.id);
      if (!app) continue;

      const rankedApp = activeApps.find(a => a.applicationId === application.id);

      let status: 'admitted' | 'not_admitted' = 'not_admitted';
      let rejectionReason: RejectionReason = null;
      let admittedPreference: number | null = null;

      if (!rankedApp) {
        status = 'not_admitted';
        rejectionReason = eligibilityReasons.get(application.id) || 'not_eligible_basic';
      } else if (rankedApp.isRejected) {
        status = 'not_admitted';
        const bestPriority = studentFinalBest.get(rankedApp.studentId);
        if (bestPriority !== undefined && rankedApp.priority > bestPriority) {
          rejectionReason = 'admitted_higher_priority';
        } else {
          rejectionReason = 'below_quota_cutoff';
        }
      } else {
        const bestPriority = studentFinalBest.get(rankedApp.studentId);
        if (bestPriority !== undefined && rankedApp.priority === bestPriority) {
          status = 'admitted';
          admittedPreference = rankedApp.priority;
          rejectionReason = null;
        } else {
          status = 'not_admitted';
          rejectionReason = 'admitted_higher_priority';
        }
      }

      decisions.push({
        applicationId: application.id,
        studentId: application.studentId,
        majorId: application.majorId,
        majorName: app.major.name,
        admissionMethod: application.admissionMethod,
        preferencePriority: application.preferencePriority,
        calculatedScore: Number(application.calculatedScore) || 0,
        rankInMajor: application.rankInMajor,
        status,
        rejectionReason,
        admittedPreference,
      });
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

  /**
   * Get detailed filter results for a session
   * @param sessionId - The admission session ID
   * @param studentId - Optional student ID to filter results
   * @returns Detailed admission decisions with rejection reasons
   */
  async getFilterResults(sessionId: string, studentId?: string) {
    // Verify session exists
    const session = await this.prisma.admissionSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Admission session ${sessionId} not found`);
    }

    // Build where clause
    const where: any = { sessionId };
    if (studentId) {
      where.studentId = studentId;
    }

    // Get all applications with related data
    const applications = await this.prisma.application.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            idCard: true,
          },
        },
        major: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: [
        { studentId: 'asc' },
        { preferencePriority: 'asc' },
      ],
    });

    // Group by student
    const studentResults = new Map<string, any>();

    for (const app of applications) {
      if (!studentResults.has(app.studentId)) {
        studentResults.set(app.studentId, {
          studentId: app.studentId,
          studentName: app.student.fullName,
          idCard: app.student.idCard,
          applications: [],
        });
      }

      const studentData = studentResults.get(app.studentId);

      // Determine rejection reason based on status and score
      let rejectionReason: RejectionReason = null;

      if (app.admissionStatus === AdmissionStatus.not_admitted) {
        if (!app.calculatedScore || Number(app.calculatedScore) === 0) {
          // Check if it's basic or quota eligibility issue
          rejectionReason = 'not_eligible_basic';
        } else if (app.rankInMajor === null) {
          rejectionReason = 'not_eligible_quota';
        } else {
          // Has score and rank but not admitted - either below cutoff or admitted elsewhere
          const admittedApp = applications.find(
            a => a.studentId === app.studentId &&
              a.admissionStatus === AdmissionStatus.admitted
          );

          if (admittedApp && admittedApp.preferencePriority < app.preferencePriority) {
            rejectionReason = 'admitted_higher_priority';
          } else {
            rejectionReason = 'below_quota_cutoff';
          }
        }
      }

      studentData.applications.push({
        applicationId: app.id,
        majorCode: app.major.code,
        majorName: app.major.name,
        admissionMethod: app.admissionMethod,
        preferencePriority: app.preferencePriority,
        calculatedScore: Number(app.calculatedScore) || 0,
        rankInMajor: app.rankInMajor,
        status: app.admissionStatus === AdmissionStatus.admitted ? 'admitted' : 'not_admitted',
        rejectionReason,
        rejectionReasonText: this.getRejectionReasonText(rejectionReason),
      });
    }

    return {
      sessionId,
      totalStudents: studentResults.size,
      students: Array.from(studentResults.values()),
    };
  }

  /**
   * Get human-readable rejection reason text in Vietnamese
   * @param reason - Rejection reason code
   * @returns Vietnamese text explanation
   */
  private getRejectionReasonText(reason: RejectionReason): string | null {
    if (!reason) return null;

    const reasonTexts: Record<string, string> = {
      not_eligible_basic: 'Không đủ điều kiện cơ bản (thiếu môn thi hoặc có môn điểm 0)',
      not_eligible_quota: 'Không đạt điều kiện chỉ tiêu (không đạt điểm sàn hoặc điểm tối thiểu từng môn)',
      below_quota_cutoff: 'Điểm thấp hơn điểm chuẩn (hết chỉ tiêu)',
      admitted_higher_priority: 'Đã trúng tuyển nguyện vọng ưu tiên cao hơn',
    };

    return reasonTexts[reason] || 'Không rõ lý do';
  }
}
