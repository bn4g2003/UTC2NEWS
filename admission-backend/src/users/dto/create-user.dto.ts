import { IsString, IsEmail, IsNotEmpty, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ 
    description: 'Username for login', 
    example: 'john.doe',
    minLength: 3
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({ 
    description: 'User password', 
    example: 'SecurePass123',
    minLength: 8
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ 
    description: 'User email address', 
    example: 'john.doe@admission.edu.vn'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    description: 'Full name of the user', 
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ 
    description: 'Whether the user account is active', 
    example: true,
    default: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
