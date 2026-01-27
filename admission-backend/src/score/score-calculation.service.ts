import { Injectable, NotFoundException } from '@nestjs/common';
import { FormulaService } from '../formula/formula.service';
import { PrismaService } from '../prisma/prisma.service';

export interface SubjectScores {
  [subject: string]: number;
}

export interface QuotaConditions {
  minTotalScore?: number;
  minSubjectScores?: Record<string, number>;
  requiredSubjects?: string[];
  subjectCombinations?: string[][];
  priorityBonus?: {
    enabled: boolean;
    maxBonus: number;
  };
}

/**
 * Service for calculating admission scores based on dynamic formulas
 */
@Injectable()
export class ScoreCalculationService {
  constructor(
    private readonly formulaService: FormulaService,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Calculate admission score based on subject scores, student info, and a dynamic formula
   * @param scores - Subject scores object
   * @param priorityPoints - Additional priority points from student info
   * @param formulaId - The dynamic formula ID to use
   * @returns Calculated score
   */
  async calculateDynamicScore(
    scores: SubjectScores,
    priorityPoints: number,
    formulaId: string,
  ): Promise<number> {
    const formula = await this.prisma.admissionFormula.findUnique({
      where: { id: formulaId },
    });

    if (!formula) {
      throw new NotFoundException(`Formula ${formulaId} not found`);
    }

    // 1. Calculate Raw Score (Subject scores only)

    // Define all standard subjects to ensure they exist in context (default to 0 if missing)
    const ALL_SUBJECTS = [
      'math', 'literature', 'english', 'physics', 'chemistry',
      'biology', 'history', 'geography', 'civic_education'
    ];

    // Initialize context with 0 for all subjects
    const context: Record<string, number> = {};
    ALL_SUBJECTS.forEach(subject => {
      context[subject] = 0;
    });

    // Merge actual scores into context
    Object.assign(context, scores);

    // Evaluate raw score
    let rawScore = 0;
    try {
      rawScore = this.formulaService.evaluate(formula.formula, context);
    } catch (error) {
      console.error(`Error calculating score for formula ${formulaId}:`, error);
      return 0; // Return 0 if formula evaluation fails
    }

    // Ensure rawScore is not negative (just in case)
    rawScore = Math.max(0, rawScore);

    // 2. Calculate Effective Priority Points (Quy chế 2025 logic)
    let effectivePriority = priorityPoints;

    // Nếu tổng điểm >= 22.5, điểm ưu tiên bị giảm dần
    if (rawScore >= 22.5) {
      // Công thức: Điểm ƯT = [(30 - Tổng điểm đạt được) / 7.5] × Mức điểm ưu tiên
      effectivePriority = ((30 - rawScore) / 7.5) * priorityPoints;
      // Không để điểm ưu tiên âm (nếu rawScore > 30, dù hiếm)
      effectivePriority = Math.max(0, effectivePriority);
    }

    // 3. Final Total Score
    const finalScore = rawScore + effectivePriority;

    // Round to 2 decimal places
    return Math.round(finalScore * 100) / 100;
  }

  /**
   * Check if application meets quota conditions
   * @param scores - Subject scores object
   * @param conditions - Quota conditions to check
   * @returns true if eligible, false otherwise
   */
  isEligibleForQuota(
    scores: SubjectScores,
    conditions: QuotaConditions,
  ): boolean {
    if (!scores || !conditions) return true;

    // 1. Check subject combinations if specified
    if (conditions.subjectCombinations && conditions.subjectCombinations.length > 0) {
      const hasValidCombination = conditions.subjectCombinations.some(
        (combination) => {
          return combination.every(
            (subject) =>
              scores[subject] !== undefined &&
              scores[subject] !== null &&
              !isNaN(scores[subject]),
          );
        },
      );

      if (!hasValidCombination) {
        return false;
      }
    }

    // 2. Check required subjects
    if (conditions.requiredSubjects && conditions.requiredSubjects.length > 0) {
      for (const subject of conditions.requiredSubjects) {
        if (
          scores[subject] === undefined ||
          scores[subject] === null ||
          isNaN(scores[subject])
        ) {
          return false;
        }
      }
    }

    // 3. Check minimum subject scores
    if (conditions.minSubjectScores) {
      for (const [subject, minScore] of Object.entries(
        conditions.minSubjectScores,
      )) {
        if (
          scores[subject] === undefined ||
          scores[subject] === null ||
          scores[subject] < minScore
        ) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if a student is eligible based on having scores for certain subjects.
   * This is now more of a generic check since formulas are dynamic.
   */
  isEligible(scores: SubjectScores, requiredSubjects: string[]): boolean {
    if (!scores) return false;
    if (!requiredSubjects || requiredSubjects.length === 0) return true;

    for (const subject of requiredSubjects) {
      if (
        scores[subject] === undefined ||
        scores[subject] === null ||
        isNaN(scores[subject])
      ) {
        return false;
      }
    }

    return true;
  }
}
