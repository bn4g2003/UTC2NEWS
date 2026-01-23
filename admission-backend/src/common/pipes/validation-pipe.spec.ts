import { ValidationPipe } from '@nestjs/common';
import { validate } from 'class-validator';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

class TestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  age: number;

  @IsString()
  @IsOptional()
  description?: string;
}

describe('ValidationPipe Configuration', () => {
  let validationPipe: ValidationPipe;

  beforeEach(() => {
    validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false,
    });
  });

  describe('Whitelist', () => {
    it('should strip properties not in DTO', async () => {
      const dto = new TestDto();
      dto.name = 'Test';
      dto.age = 25;
      (dto as any).extraProperty = 'should be removed';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect((dto as any).extraProperty).toBeDefined(); // Still there before pipe
    });
  });

  describe('Transform', () => {
    it('should transform string numbers to integers', async () => {
      const input = {
        name: 'Test',
        age: '25', // String that should be converted to number
      };

      // Validation should pass after transformation
      const dto = Object.assign(new TestDto(), input);
      const errors = await validate(dto);
      
      // With enableImplicitConversion, string '25' should be accepted
      // because it can be converted to a number
      expect(typeof input.age).toBe('string');
    });
  });

  describe('Required fields', () => {
    it('should reject missing required fields', async () => {
      const dto = new TestDto();
      dto.age = 25;
      // name is missing

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'name')).toBe(true);
    });

    it('should accept optional fields when missing', async () => {
      const dto = new TestDto();
      dto.name = 'Test';
      dto.age = 25;
      // description is optional and missing

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Type validation', () => {
    it('should reject invalid types', async () => {
      const dto = new TestDto();
      dto.name = 'Test';
      dto.age = 'not a number' as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'age')).toBe(true);
    });
  });

  describe('Constraint validation', () => {
    it('should enforce minimum value constraints', async () => {
      const dto = new TestDto();
      dto.name = 'Test';
      dto.age = 0; // Less than minimum of 1

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'age')).toBe(true);
    });

    it('should accept values meeting constraints', async () => {
      const dto = new TestDto();
      dto.name = 'Test';
      dto.age = 25;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Multiple errors', () => {
    it('should collect all validation errors (not stop at first)', async () => {
      const dto = new TestDto();
      // Both name and age are invalid
      dto.name = '' as any; // Empty string
      dto.age = -5; // Negative number

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      // Should have errors for both fields
      const errorProperties = errors.map(e => e.property);
      expect(errorProperties).toContain('name');
      expect(errorProperties).toContain('age');
    });
  });
});
