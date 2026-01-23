import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator for phone numbers
 * Validates Vietnamese phone numbers (10-11 digits starting with 0)
 */
export function IsPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          // Vietnamese phone number: starts with 0, 10-11 digits
          const phoneRegex = /^0\d{9,10}$/;
          return phoneRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Phone number must be a valid Vietnamese phone number (10-11 digits starting with 0)';
        },
      },
    });
  };
}
