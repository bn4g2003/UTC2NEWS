import { validate } from 'class-validator';
import { IsIdCard } from './is-id-card.validator';
import { IsPhoneNumber } from './is-phone-number.validator';
import { IsScore } from './is-score.validator';
import { IsMajorCode } from './is-major-code.validator';

class TestIdCardDto {
  @IsIdCard()
  idCard: string;
}

class TestPhoneDto {
  @IsPhoneNumber()
  phone: string;
}

class TestScoreDto {
  @IsScore()
  score: number;
}

class TestMajorCodeDto {
  @IsMajorCode()
  majorCode: string;
}

describe('Custom Validators', () => {
  describe('IsIdCard', () => {
    it('should accept valid ID card numbers', async () => {
      const dto = new TestIdCardDto();
      dto.idCard = '123456789';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept 12-character ID cards', async () => {
      const dto = new TestIdCardDto();
      dto.idCard = 'ABC123456789';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject ID cards shorter than 9 characters', async () => {
      const dto = new TestIdCardDto();
      dto.idCard = '12345678';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isIdCard).toBeDefined();
    });

    it('should reject ID cards longer than 12 characters', async () => {
      const dto = new TestIdCardDto();
      dto.idCard = '1234567890123';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject ID cards with special characters', async () => {
      const dto = new TestIdCardDto();
      dto.idCard = '123-456-789';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject non-string values', async () => {
      const dto = new TestIdCardDto();
      dto.idCard = 123456789 as any;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('IsPhoneNumber', () => {
    it('should accept valid 10-digit Vietnamese phone numbers', async () => {
      const dto = new TestPhoneDto();
      dto.phone = '0912345678';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid 11-digit Vietnamese phone numbers', async () => {
      const dto = new TestPhoneDto();
      dto.phone = '09123456789';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject phone numbers not starting with 0', async () => {
      const dto = new TestPhoneDto();
      dto.phone = '9123456789';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isPhoneNumber).toBeDefined();
    });

    it('should reject phone numbers shorter than 10 digits', async () => {
      const dto = new TestPhoneDto();
      dto.phone = '091234567';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject phone numbers longer than 11 digits', async () => {
      const dto = new TestPhoneDto();
      dto.phone = '091234567890';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject phone numbers with non-numeric characters', async () => {
      const dto = new TestPhoneDto();
      dto.phone = '091-234-5678';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('IsScore', () => {
    it('should accept valid scores between 0 and 10', async () => {
      const dto = new TestScoreDto();
      dto.score = 7.5;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept score of 0', async () => {
      const dto = new TestScoreDto();
      dto.score = 0;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept score of 10', async () => {
      const dto = new TestScoreDto();
      dto.score = 10;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject negative scores', async () => {
      const dto = new TestScoreDto();
      dto.score = -1;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isScore).toBeDefined();
    });

    it('should reject scores greater than 10', async () => {
      const dto = new TestScoreDto();
      dto.score = 11;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject non-numeric values', async () => {
      const dto = new TestScoreDto();
      dto.score = '7.5' as any;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('IsMajorCode', () => {
    it('should accept valid major codes', async () => {
      const dto = new TestMajorCodeDto();
      dto.majorCode = 'CS101';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept 2-character major codes', async () => {
      const dto = new TestMajorCodeDto();
      dto.majorCode = 'CS';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept 10-character major codes', async () => {
      const dto = new TestMajorCodeDto();
      dto.majorCode = 'ABCDEFGH12';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject major codes shorter than 2 characters', async () => {
      const dto = new TestMajorCodeDto();
      dto.majorCode = 'C';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isMajorCode).toBeDefined();
    });

    it('should reject major codes longer than 10 characters', async () => {
      const dto = new TestMajorCodeDto();
      dto.majorCode = 'ABCDEFGH123';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject lowercase major codes', async () => {
      const dto = new TestMajorCodeDto();
      dto.majorCode = 'cs101';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject major codes with special characters', async () => {
      const dto = new TestMajorCodeDto();
      dto.majorCode = 'CS-101';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
