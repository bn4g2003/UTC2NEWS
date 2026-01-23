import { Injectable } from '@nestjs/common';

export interface SubjectScores {
  [subject: string]: number;
}

export interface AdmissionMethodConfig {
  name: string;
  formula: string;
  requiredSubjects: string[];
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
  };

  /**
   * Calculate admission score based on subject scores, priority points, and admission method
   * @param scores - Subject scores object
   * @param priorityPoints - Additional priority points
   * @param admissionMethod - The admission method to use for calculation
   * @returns Calculated score
   */
  calculateScore(
    scores: SubjectScores,
    priorityPoints: number,
    admissionMethod: string,
    block?: string,
  ): number {
    const methodConfig = this.admissionMethods[admissionMethod];

    if (!methodConfig) {
      throw new Error(`Unknown admission method: ${admissionMethod}`);
    }

    // Determine required subjects: use block if provided, otherwise use method defaults
    let requiredSubjects = methodConfig.requiredSubjects;
    if (block && this.admissionBlocks[block]) {
      requiredSubjects = this.admissionBlocks[block];
    }

    // Check if all required subjects are present
    if (!this.isEligible(scores, admissionMethod, block)) {
      return 0; // Return 0 for ineligible applications
    }

    let baseScore = 0;

    // Apply formula based on admission method
    switch (methodConfig.formula) {
      case 'sum':
        // Sum of all required subject scores
        baseScore = requiredSubjects.reduce(
          (sum, subject) => sum + (scores[subject] || 0),
          0,
        );
        break;

      case 'average':
        // Average of all required subject scores
        const totalScore = requiredSubjects.reduce(
          (sum, subject) => sum + (scores[subject] || 0),
          0,
        );
        baseScore = totalScore / requiredSubjects.length;
        break;

      case 'weighted':
        // Weighted formula: math * 2 + physics * 1.5
        baseScore =
          (scores['math'] || 0) * 2 + (scores['physics'] || 0) * 1.5;
        break;

      default:
        throw new Error(`Unknown formula: ${methodConfig.formula}`);
    }

    // Add priority points
    const finalScore = baseScore + priorityPoints;

    // Round to 2 decimal places
    return Math.round(finalScore * 100) / 100;
  }

  /**
   * Get the list of required subjects for an admission method or block
   * @param admissionMethod - The admission method
   * @param block - Optional block code
   * @returns Array of required subject names
   */
  getRequiredSubjects(admissionMethod: string, block?: string): string[] {
    if (block && this.admissionBlocks[block]) {
      return this.admissionBlocks[block];
    }

    const methodConfig = this.admissionMethods[admissionMethod];

    if (!methodConfig) {
      throw new Error(`Unknown admission method: ${admissionMethod}`);
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
