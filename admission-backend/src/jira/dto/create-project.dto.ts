import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(2, 10)
  @Matches(/^[A-Z]+$/, { message: 'Key must be uppercase letters only' })
  key: string;

  @IsOptional()
  @IsString()
  description?: string;
}
