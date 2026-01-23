import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator for major codes
 * Validates that major codes follow the standard format (e.g., CS101, ENG202)
 */
export function IsMajorCode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isMajorCode',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          // Major code format: 2-10 uppercase letters/numbers
          const majorCodeRegex = /^[A-Z0-9]{2,10}$/;
          return majorCodeRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Major code must be 2-10 uppercase alphanumeric characters';
        },
      },
    });
  };
}
