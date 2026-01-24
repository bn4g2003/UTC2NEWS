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
   * Map block codes to admission methods
   * A00, A01, B00, C00 -> entrance_exam (thi đầu vào)
   * D01, D07, D08, D09, D10 -> high_school_transcript (xét học bạ)
   */
  private mapBlockToAdmissionMethod(block: string): string {
    const blockUpper = block.toUpperCase();
    
    // Blocks for entrance exam (mainly science/math blocks)
    if (['A00', 'A01', 'B00', 'C00'].includes(blockUpper)) {
      return 'entrance_exam';
    }
    
    // Blocks for high school transcript (mainly include literature)
    if (['D01', 'D07', 'D08', 'D09', 'D10'].includes(blockUpper)) {
      return 'high_school_transcript';
    }
    
    // Default to entrance_exam
    return 'entrance_exam';
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

    // Create quota map for quick lookup: majorId-admissionMethod -> quota
    const quotaMap = new Map<string, any>();
    for (const quota of session.quotas) {
      const key = `${quota.majorId}-${quota.admissionMethod}`;
      quotaMap.set(key, quota);
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

      // Determine the actual admission method for quota lookup
      // If admissionMethod is a block code (A00, D01, etc.), map it to the actual method
      let actualMethod = application.admissionMethod;
      
      // Check if it's a block code (starts with letter followed by digits)
      if (/^[A-Z]\d{2}$/i.test(actualMethod)) {
        actualMethod = this.mapBlockToAdmissionMethod(actualMethod);
      }
      
      const quotaKey = `${application.majorId}-${actualMethod}`;
      const quota = quotaMap.get(quotaKey);
      const conditions = quota?.conditions as any;

      // Check basic eligibility (has required subjects)
      const isBasicEligible = this.scoreCalculationService.isEligible(
        subjectScores,
        application.admissionMethod,
      );

      // Check quota-specific conditions
      const isQuotaEligible = conditions
        ? this.scoreCalculationService.isEligibleForQuota(
          subjectScores,
          conditions,
          application.admissionMethod,
        )
        : true;

      const isEligible = isBasicEligible && isQuotaEligible;

      // Track rejection reason
      if (!isBasicEligible) {
        rejectionReasons.set(application.id, 'not_eligible_basic');
      } else if (!isQuotaEligible) {
        rejectionReasons.set(application.id, 'not_eligible_quota');
      }

      // Calculate score with conditions
      const calculatedScore = isEligible
        ? this.scoreCalculationService.calculateScore(
          subjectScores,
          priorityPoints,
          application.admissionMethod,
          undefined,
          conditions,
        )
        : 0;

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
      // Map block code to actual admission method for grouping
      let baseMethod = app.admissionMethod;
      if (/^[A-Z]\d{2}$/i.test(baseMethod)) {
        baseMethod = this.mapBlockToAdmissionMethod(baseMethod);
      }
      
      const majorMethodKey = `${app.majorId}-${baseMethod}`;
      const prevKey = `${currentMajor}-${currentMethod}`;

      // Reset rank when we move to a new major-method combination
      if (majorMethodKey !== prevKey) {
        currentRank = 1;
        currentMajor = app.majorId;
        currentMethod = baseMethod;
      } else {
        currentRank++;
      }

      rankedApplications.push({
        applicationId: app.id,
        studentId: app.studentId,
        majorId: app.majorId,
        admissionMethod: baseMethod, // Store normalized method for decision logic
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
  /**
   * Process preferences using Score-Priority (Stable Matching) logic.
   * Ensures that within each major/method, students are admitted based on score regardless of preference priority,
   * while ensuring they only take a spot in their highest possible priority major.
   * @param sessionId - The admission session ID
   * @param rankedApps - Array of ranked applications
   * @param eligibilityReasons - Map of applicationId -> rejection reason for ineligible apps
   * @param tx - Prisma transaction client
   * @returns Array of admission decisions with detailed rejection reasons
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
      const key = `${quota.majorId}-${quota.admissionMethod}`;
      quotaMap.set(key, quota.quota);
    }

    // 2. Get all applications (including ineligible ones) to return complete results
    const allApplications = await tx.application.findMany({
      where: { sessionId },
      include: {
        major: true,
      },
    });

    // Create a map for quick lookup
    const appMap = new Map(allApplications.map(app => [app.id, app]));

    // 3. Track rejection status for each application
    // activeApps starts with all ranked applications (eligible ones)
    let activeApps = rankedApps.map(app => ({ ...app, isRejected: false }));
    let changed = true;

    // 4. Iterative Stable Matching (Gale-Shapley style)
    // In each round, students "propose" to their highest priority non-rejected application
    while (changed) {
      changed = false;

      // Map to track who is currently applying to which major
      // Key: MajorKey, Value: List of Applications
      const majorProposals = new Map<string, typeof activeApps>();

      // Each student "proposes" to their highest priority application that hasn't rejected them
      const studentBestApp = new Map<string, number>(); // studentId -> priority

      // Identify the current "best" active application for each student
      for (const app of activeApps) {
        if (app.isRejected) continue;

        const currentBest = studentBestApp.get(app.studentId);
        if (currentBest === undefined || app.priority < currentBest) {
          studentBestApp.set(app.studentId, app.priority);
        }
      }

      // Group proposals by major
      for (const app of activeApps) {
        if (app.isRejected) continue;
        const bestPriority = studentBestApp.get(app.studentId);
        if (bestPriority !== undefined && app.priority === bestPriority) {
          const key = `${app.majorId}-${app.admissionMethod}`;
          let majorQueue = majorProposals.get(key);
          if (!majorQueue) {
            majorQueue = [];
            majorProposals.set(key, majorQueue);
          }
          majorQueue.push(app);
        }
      }

      // Each major rejects those beyond its quota
      for (const [majorKey, proposals] of majorProposals.entries()) {
        const quota = quotaMap.get(majorKey) || 0;

        if (proposals.length > quota) {
          // Sort proposals by score DESC, then studentId ASC (tie-breaker)
          proposals.sort((a, b) => {
            if (b.calculatedScore !== a.calculatedScore) {
              return b.calculatedScore - a.calculatedScore;
            }
            return a.studentId.localeCompare(b.studentId);
          });

          // Reject those beyond quota
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

    // 5. Final decisions based on stable state
    const decisions: AdmissionDecision[] = [];

    // Create a map of a student's best non-rejected priority for quick lookup
    const studentFinalBest = new Map<string, number>();
    for (const app of activeApps) {
      if (!app.isRejected) {
        const currentBest = studentFinalBest.get(app.studentId);
        if (currentBest === undefined || app.priority < currentBest) {
          studentFinalBest.set(app.studentId, app.priority);
        }
      }
    }

    // 6. Process ALL applications (including ineligible ones)
    for (const application of allApplications) {
      const app = appMap.get(application.id);
      if (!app) continue;

      // Check if this app was in the eligible/ranked list
      const rankedApp = activeApps.find(a => a.applicationId === application.id);
      
      let status: 'admitted' | 'not_admitted' = 'not_admitted';
      let rejectionReason: RejectionReason = null;
      let admittedPreference: number | null = null;

      // Case 1: Not eligible (not in ranked apps)
      if (!rankedApp) {
        status = 'not_admitted';
        rejectionReason = eligibilityReasons.get(application.id) || 'not_eligible_basic';
      } 
      // Case 2: Eligible but rejected during matching
      else if (rankedApp.isRejected) {
        status = 'not_admitted';
        const bestPriority = studentFinalBest.get(rankedApp.studentId);
        
        // If student has a better priority admitted, this is lower priority
        if (bestPriority !== undefined && rankedApp.priority > bestPriority) {
          rejectionReason = 'admitted_higher_priority';
        } else {
          // Otherwise, didn't make the quota cutoff
          rejectionReason = 'below_quota_cutoff';
        }
      }
      // Case 3: Admitted
      else {
        const bestPriority = studentFinalBest.get(rankedApp.studentId);
        if (bestPriority !== undefined && rankedApp.priority === bestPriority) {
          status = 'admitted';
          admittedPreference = rankedApp.priority;
          rejectionReason = null;
        } else {
          // This shouldn't happen, but handle it
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
