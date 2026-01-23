import { Test, TestingModule } from '@nestjs/testing';
import { ScoreCalculationService } from './score-calculation.service';

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
    it('should calculate score for entrance_exam method using sum formula', () => {
      const scores = { math: 8, physics: 7, chemistry: 9 };
      const priorityPoints = 1.5;
      const result = service.calculateScore(scores, priorityPoints, 'entrance_exam');
      
      // Sum: 8 + 7 + 9 = 24, plus 1.5 priority = 25.5
      expect(result).toBe(25.5);
    });

    it('should calculate score for high_school_transcript method using average formula', () => {
      const scores = { math: 8, literature: 7, english: 9 };
      const priorityPoints = 0.5;
      const result = service.calculateScore(scores, priorityPoints, 'high_school_transcript');
      
      // Average: (8 + 7 + 9) / 3 = 8, plus 0.5 priority = 8.5
      expect(result).toBe(8.5);
    });

    it('should calculate score for direct_admission method using weighted formula', () => {
      const scores = { math: 8, physics: 6 };
      const priorityPoints = 1;
      const result = service.calculateScore(scores, priorityPoints, 'direct_admission');
      
      // Weighted: 8 * 2 + 6 * 1.5 = 16 + 9 = 25, plus 1 priority = 26
      expect(result).toBe(26);
    });

    it('should return 0 for ineligible applications with missing subjects', () => {
      const scores = { math: 8 }; // Missing physics and chemistry
      const priorityPoints = 1;
      const result = service.calculateScore(scores, priorityPoints, 'entrance_exam');
      
      expect(result).toBe(0);
    });

    it('should throw error for unknown admission method', () => {
      const scores = { math: 8, physics: 7 };
      const priorityPoints = 0;
      
      expect(() => {
        service.calculateScore(scores, priorityPoints, 'unknown_method');
      }).toThrow('Unknown admission method: unknown_method');
    });

    it('should round result to 2 decimal places', () => {
      const scores = { math: 8.333, literature: 7.666, english: 9.111 };
      const priorityPoints = 0.5;
      const result = service.calculateScore(scores, priorityPoints, 'high_school_transcript');
      
      // Average: (8.333 + 7.666 + 9.111) / 3 = 8.37, plus 0.5 = 8.87
      expect(result).toBe(8.87);
    });
  });

  describe('getRequiredSubjects', () => {
    it('should return required subjects for entrance_exam', () => {
      const subjects = service.getRequiredSubjects('entrance_exam');
      expect(subjects).toEqual(['math', 'physics', 'chemistry']);
    });

    it('should return required subjects for high_school_transcript', () => {
      const subjects = service.getRequiredSubjects('high_school_transcript');
      expect(subjects).toEqual(['math', 'literature', 'english']);
    });

    it('should return required subjects for direct_admission', () => {
      const subjects = service.getRequiredSubjects('direct_admission');
      expect(subjects).toEqual(['math', 'physics']);
    });

    it('should throw error for unknown admission method', () => {
      expect(() => {
        service.getRequiredSubjects('unknown_method');
      }).toThrow('Unknown admission method: unknown_method');
    });
  });

  describe('isEligible', () => {
    it('should return true when all required subjects are present', () => {
      const scores = { math: 8, physics: 7, chemistry: 9 };
      const result = service.isEligible(scores, 'entrance_exam');
      expect(result).toBe(true);
    });

    it('should return false when a required subject is missing', () => {
      const scores = { math: 8, physics: 7 }; // Missing chemistry
      const result = service.isEligible(scores, 'entrance_exam');
      expect(result).toBe(false);
    });

    it('should return false when a required subject is null', () => {
      const scores = { math: 8, physics: 7, chemistry: null };
      const result = service.isEligible(scores, 'entrance_exam');
      expect(result).toBe(false);
    });

    it('should return false when a required subject is undefined', () => {
      const scores = { math: 8, physics: 7, chemistry: undefined };
      const result = service.isEligible(scores, 'entrance_exam');
      expect(result).toBe(false);
    });

    it('should return false when a required subject is NaN', () => {
      const scores = { math: 8, physics: 7, chemistry: NaN };
      const result = service.isEligible(scores, 'entrance_exam');
      expect(result).toBe(false);
    });

    it('should return true when extra subjects are present', () => {
      const scores = { math: 8, physics: 7, chemistry: 9, biology: 6 };
      const result = service.isEligible(scores, 'entrance_exam');
      expect(result).toBe(true);
    });
  });

  describe('getAvailableAdmissionMethods', () => {
    it('should return all available admission methods', () => {
      const methods = service.getAvailableAdmissionMethods();
      expect(methods).toContain('entrance_exam');
      expect(methods).toContain('high_school_transcript');
      expect(methods).toContain('direct_admission');
      expect(methods.length).toBe(3);
    });
  });

  describe('getAdmissionMethodConfig', () => {
    it('should return config for entrance_exam', () => {
      const config = service.getAdmissionMethodConfig('entrance_exam');
      expect(config.name).toBe('Entrance Exam');
      expect(config.formula).toBe('sum');
      expect(config.requiredSubjects).toEqual(['math', 'physics', 'chemistry']);
    });

    it('should throw error for unknown admission method', () => {
      expect(() => {
        service.getAdmissionMethodConfig('unknown_method');
      }).toThrow('Unknown admission method: unknown_method');
    });
  });
});
