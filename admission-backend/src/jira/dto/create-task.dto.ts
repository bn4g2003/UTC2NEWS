import { IsString, IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';

export enum TaskType {
  BUG = 'BUG',
  FEATURE = 'FEATURE',
  STORY = 'STORY',
  TASK = 'TASK',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  columnId: string;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString({ each: true })
  labels?: string[];
}
