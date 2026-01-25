import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsOptional, IsNumber, IsUUID, IsString } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsString()
  blockedReason?: string;
}

export class MoveTaskDto {
  @IsUUID()
  columnId: string;

  @IsNumber()
  position: number;

  @IsOptional()
  @IsString()
  blockedReason?: string;
}
