import { Injectable } from '@nestjs/common';

export interface SubjectScores {
  [subject: string]: number;
}

export interface AdmissionMethodConfig {
  name: string;
  formula: string;
  requiredSubjects: string[];
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
 * Service for calculating admission scores based on different admission methods
 */
@Injectable()
export class ScoreCalculationService {
  // Define admission method configurations
  private readonly admissionMethods: Record<string, AdmissionMethodConfig> = {
    entrance_exam: {
      name: 'Entrance Exam',
      formula: 'sum',
      requiredSubjects: ['math', 'physics', 'chemistry'],
    },
    high_school_transcript: {
      name: 'High School Transcript',
      formula: 'average',
      requiredSubjects: ['math', 'literature', 'english'],
    },
    direct_admission: {
      name: 'Direct Admission',
      formula: 'weighted',
      requiredSubjects: ['math', 'physics'],
    },
  };

  // Common Vietnamese admission blocks mapping
  private readonly admissionBlocks: Record<string, string[]> = {
    A00: ['math', 'physics', 'chemistry'],
    A01: ['math', 'physics', 'english'],
    B00: ['math', 'chemistry', 'biology'],
    C00: ['literature', 'history', 'geography'],
    D01: ['math', 'literature', 'english'],
    D07: ['math', 'chemistry', 'english'],
    D08: ['math', 'biology', 'english'],
    D09: ['math', 'geography', 'english'],
    D10: ['math', 'history', 'english'],
  };

  /**
   * Calculate admission score based on subject scores, priority points, and admission method
   * @param scores - Subject scores object
   * @param priorityPoints - Additional priority points
   * @param admissionMethod - The admission method or block code (A00, A01, etc.)
   * @param block - Optional block code (deprecated, use admissionMethod instead)
   * @param conditions - Optional quota conditions to apply
   * @returns Calculated score
   */
  /**
   * Calculate admission score based on subject scores, priority points, and admission method
   * @param scores - Subject scores object
   * @param priorityPoints - Additional priority points
   * @param admissionMethod - The admission method or block code (A00, A01, etc.)
   * @param block - Optional block code (deprecated, use admissionMethod instead)
   * @param conditions - Optional quota conditions to apply
   * @returns Calculated score
   */
  calculateScore(
    scores: SubjectScores,
    priorityPoints: number,
    admissionMethod: string,
    block?: string,
    conditions?: QuotaConditions,
  ): number {
    const baseScore = this.calculateBaseScore(scores, admissionMethod, block);

    if (baseScore === 0 && !this.isEligible(scores, admissionMethod, block)) {
      return 0;
    }

    // Apply priority bonus based on conditions
    let priorityBonus = priorityPoints;
    if (conditions?.priorityBonus) {
      if (!conditions.priorityBonus.enabled) {
        priorityBonus = 0;
      } else if (conditions.priorityBonus.maxBonus !== undefined) {
        priorityBonus = Math.min(priorityPoints, conditions.priorityBonus.maxBonus);
      }
    }

    const finalScore = baseScore + priorityBonus;

    // Round to 2 decimal places
    return Math.round(finalScore * 100) / 100;
  }

  /**
   * Calculate base score (without priority) based on admission method/block
   * @param scores - Subject scores object
   * @param admissionMethod - The admission method or block code
   * @param block - Optional block code
   * @returns Base score or 0 if ineligible
   */
  calculateBaseScore(
    scores: SubjectScores,
    admissionMethod: string,
    block?: string,
  ): number {
    // Handle combined Method|Block string
    const { method: actualMethod, block: actualBlock } = this.parseMethodAndBlock(admissionMethod, block);

    // Check if actualMethod is actually a block code
    const isBlockCode = this.admissionBlocks[actualMethod.toUpperCase()];

    if (isBlockCode) {
      const requiredSubjects = isBlockCode;

      if (!this.isEligible(scores, actualMethod)) {
        return 0;
      }

      return requiredSubjects.reduce(
        (sum, subject) => sum + (scores[subject] || 0),
        0,
      );
    }

    const methodConfig = this.admissionMethods[actualMethod];
    if (!methodConfig) return 0;

    const requiredSubjects = actualBlock && this.admissionBlocks[actualBlock.toUpperCase()]
      ? this.admissionBlocks[actualBlock.toUpperCase()]
      : methodConfig.requiredSubjects;

    if (!this.isEligible(scores, actualMethod, actualBlock)) {
      return 0;
    }

    switch (methodConfig.formula) {
      case 'sum':
        return requiredSubjects.reduce(
          (sum, subject) => sum + (scores[subject] || 0),
          0,
        );
      case 'average':
        const sum = requiredSubjects.reduce(
          (sum, subject) => sum + (scores[subject] || 0),
          0,
        );
        return sum / requiredSubjects.length;
      case 'weighted':
        // Custom logic for weighted (can be expanded)
        return (scores['math'] || 0) * 2 + (scores['physics'] || 0) * 1.5;
      default:
        return 0;
    }
  }

  /**
   * Check if application meets quota conditions
   * @param scores - Subject scores object
   * @param conditions - Quota conditions to check
   * @param admissionMethod - The admission method used
   * @returns true if eligible, false otherwise
   */
  isEligibleForQuota(
    scores: SubjectScores,
    conditions: QuotaConditions,
    admissionMethod?: string,
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

    // 4. Check minimum total score (before priority bonus)
    if (conditions.minTotalScore !== undefined) {
      // Use relevant subjects only if admissionMethod is provided
      let totalScore = 0;
      if (admissionMethod) {
        totalScore = this.calculateBaseScore(scores, admissionMethod);
      } else {
        // Fallback to summing all available scores (less accurate)
        totalScore = Object.values(scores).reduce(
          (sum, score) => sum + (score || 0),
          0,
        );
      }

      if (totalScore < conditions.minTotalScore) {
        return false;
      }
    }

    return true;
  }

  /**
   * Helper to parse combined Method|Block strings
   */
  private parseMethodAndBlock(admissionMethod: string, block?: string): { method: string, block?: string } {
    if (admissionMethod.includes('|')) {
      const parts = admissionMethod.split('|');
      return { method: parts[0], block: parts[1] };
    }
    return { method: admissionMethod, block };
  }

  /**
   * Get the list of required subjects for an admission method or block
   * @param admissionMethod - The admission method or block code
   * @param block - Optional block code (deprecated)
   * @returns Array of required subject names
   */
  getRequiredSubjects(admissionMethod: string, block?: string): string[] {
    const { method: actualMethod, block: actualBlock } = this.parseMethodAndBlock(admissionMethod, block);

    // Check if actualMethod is a block code
    if (this.admissionBlocks[actualMethod.toUpperCase()]) {
      return this.admissionBlocks[actualMethod.toUpperCase()];
    }

    // Check if block parameter is provided
    if (actualBlock && this.admissionBlocks[actualBlock.toUpperCase()]) {
      return this.admissionBlocks[actualBlock.toUpperCase()];
    }

    // Otherwise, use admission method config
    const methodConfig = this.admissionMethods[actualMethod];

    if (!methodConfig) {
      throw new Error(`Unknown admission method or block code: ${actualMethod}`);
    }

    return methodConfig.requiredSubjects;
  }

  /**
   * Check if a student is eligible based on having all required subject scores
   * @param scores - Subject scores object
   * @param admissionMethod - The admission method
   * @param block - Optional block code
   * @returns true if eligible, false otherwise
   */
  isEligible(scores: SubjectScores, admissionMethod: string, block?: string): boolean {
    if (!scores) return false;
    const requiredSubjects = this.getRequiredSubjects(admissionMethod, block);

    // Check if all required subjects have scores
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

  /**
   * Get all available admission methods
   * @returns Array of admission method names
   */
  getAvailableAdmissionMethods(): string[] {
    return Object.keys(this.admissionMethods);
  }

  /**
   * Get admission method configuration
   * @param admissionMethod - The admission method
   * @returns Admission method configuration
   */
  getAdmissionMethodConfig(admissionMethod: string): AdmissionMethodConfig {
    const methodConfig = this.admissionMethods[admissionMethod];

    if (!methodConfig) {
      throw new Error(`Unknown admission method: ${admissionMethod}`);
    }

    return methodConfig;
  }
}
