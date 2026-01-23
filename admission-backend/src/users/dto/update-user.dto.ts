import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ 
    description: 'User email address', 
    example: 'john.doe@admission.edu.vn',
    required: false
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ 
    description: 'Full name of the user', 
    example: 'John Doe',
    required: false
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ 
    description: 'Whether the user account is active', 
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
