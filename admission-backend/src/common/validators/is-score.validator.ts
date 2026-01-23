import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator for academic scores
 * Validates that scores are between 0 and 10 (Vietnamese grading system)
 */
export function IsScore(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isScore',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'number') {
            return false;
          }
          // Score must be between 0 and 10
          return value >= 0 && value <= 10;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Score must be a number between 0 and 10';
        },
      },
    });
  };
}
