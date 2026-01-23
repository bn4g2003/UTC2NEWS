import { Test, TestingModule } from '@nestjs/testing';
import { ScoreCalculationService, QuotaConditions } from './score-calculation.service';

describe('ScoreCalculationService', () => {
  let service: ScoreCalculationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScoreCalculationService],
    }).compile();

    service = module.get<ScoreCalculationService>(ScoreCalculationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateScore', () => {
    it('should calculate score with priority bonus', () => {
      const scores = { math: 8, physics: 7, chemistry: 6 };
      const priorityPoints = 2;
      const score = service.calculateScore(
        scores,
        priorityPoints,
        'entrance_exam',
      );
      expect(score).toBe(23); // 8 + 7 + 6 + 2
    });

    it('should apply max priority bonus from conditions', () => {
      const scores = { math: 8, physics: 7, chemistry: 6 };
      const priorityPoints = 3;
      const conditions: QuotaConditions = {
        priorityBonus: {
          enabled: true,
          maxBonus: 2,
        },
      };
      const score = service.calculateScore(
        scores,
        priorityPoints,
        'entrance_exam',
        undefined,
        conditions,
      );
      expect(score).toBe(23); // 8 + 7 + 6 + 2 (capped at 2)
    });

    it('should disable priority bonus when conditions specify', () => {
      const scores = { math: 8, physics: 7, chemistry: 6 };
      const priorityPoints = 2;
      const conditions: QuotaConditions = {
        priorityBonus: {
          enabled: false,
          maxBonus: 0,
        },
      };
      const score = service.calculateScore(
        scores,
        priorityPoints,
        'entrance_exam',
        undefined,
        conditions,
      );
      expect(score).toBe(21); // 8 + 7 + 6 (no bonus)
    });
  });

  describe('isEligibleForQuota', () => {
    it('should pass when all conditions are met', () => {
      const scores = { math: 8, physics: 7, chemistry: 6 };
      const conditions: QuotaConditions = {
        minTotalScore: 18,
        minSubjectScores: {
          math: 5,
          physics: 4,
          chemistry: 4,
        },
        requiredSubjects: ['math', 'physics', 'chemistry'],
      };
      const result = service.isEligibleForQuota(scores, conditions);
      expect(result).toBe(true);
    });

    it('should fail when total score is below minimum', () => {
      const scores = { math: 5, physics: 5, chemistry: 5 };
      const conditions: QuotaConditions = {
        minTotalScore: 18,
      };
      const result = service.isEligibleForQuota(scores, conditions);
      expect(result).toBe(false);
    });

    it('should fail when subject score is below minimum', () => {
      const scores = { math: 8, physics: 3, chemistry: 6 };
      const conditions: QuotaConditions = {
        minSubjectScores: {
          math: 5,
          physics: 4,
          chemistry: 4,
        },
      };
      const result = service.isEligibleForQuota(scores, conditions);
      expect(result).toBe(false);
    });

    it('should fail when required subject is missing', () => {
      const scores = { math: 8, physics: 7 };
      const conditions: QuotaConditions = {
        requiredSubjects: ['math', 'physics', 'chemistry'],
      };
      const result = service.isEligibleForQuota(scores, conditions);
      expect(result).toBe(false);
    });

    it('should pass when valid subject combination exists', () => {
      const scores = { math: 8, physics: 7, english: 6 };
      const conditions: QuotaConditions = {
        subjectCombinations: [
          ['math', 'physics', 'chemistry'],
          ['math', 'physics', 'english'],
        ],
      };
      const result = service.isEligibleForQuota(scores, conditions);
      expect(result).toBe(true);
    });

    it('should fail when no valid subject combination exists', () => {
      const scores = { math: 8, literature: 7, english: 6 };
      const conditions: QuotaConditions = {
        subjectCombinations: [
          ['math', 'physics', 'chemistry'],
          ['math', 'physics', 'english'],
        ],
      };
      const result = service.isEligibleForQuota(scores, conditions);
      expect(result).toBe(false);
    });

    it('should pass when no conditions are specified', () => {
      const scores = { math: 8, physics: 7, chemistry: 6 };
      const conditions: QuotaConditions = {};
      const result = service.isEligibleForQuota(scores, conditions);
      expect(result).toBe(true);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle complete quota conditions', () => {
      const scores = { math: 8, physics: 7, chemistry: 6 };
      const conditions: QuotaConditions = {
        minTotalScore: 18,
        minSubjectScores: {
          math: 5,
          physics: 4,
          chemistry: 4,
        },
        requiredSubjects: ['math', 'physics', 'chemistry'],
        subjectCombinations: [['math', 'physics', 'chemistry']],
        priorityBonus: {
          enabled: true,
          maxBonus: 2,
        },
      };

      // Check eligibility
      const isEligible = service.isEligibleForQuota(scores, conditions);
      expect(isEligible).toBe(true);

      // Calculate score
      const score = service.calculateScore(
        scores,
        3,
        'entrance_exam',
        undefined,
        conditions,
      );
      expect(score).toBe(23); // 8 + 7 + 6 + 2 (capped)
    });

    it('should reject student with low subject score despite high total', () => {
      const scores = { math: 10, physics: 3, chemistry: 10 };
      const conditions: QuotaConditions = {
        minTotalScore: 18,
        minSubjectScores: {
          physics: 4,
        },
      };

      const isEligible = service.isEligibleForQuota(scores, conditions);
      expect(isEligible).toBe(false);
    });
  });
});
