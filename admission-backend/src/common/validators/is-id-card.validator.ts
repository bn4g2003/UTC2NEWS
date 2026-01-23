import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator for ID card numbers
 * Validates that the ID card is between 9-12 characters and contains only alphanumeric characters
 */
export function IsIdCard(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isIdCard',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') {
            return false;
          }
          // ID card should be 9-12 alphanumeric characters
          const idCardRegex = /^[A-Za-z0-9]{9,12}$/;
          return idCardRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'ID card must be 9-12 alphanumeric characters';
        },
      },
    });
  };
}
