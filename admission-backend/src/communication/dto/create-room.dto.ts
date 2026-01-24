import { IsString, IsArray, IsOptional, IsEnum, ArrayMinSize, IsBoolean } from 'class-validator';

export enum RoomType {
  DIRECT = 'DIRECT',        // Chat 1-1
  GROUP = 'GROUP',          // Nhóm riêng tư (cần mời)
  CHANNEL = 'CHANNEL',      // Kênh công khai (ai cũng có thể tham gia)
}

export class CreateRoomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(RoomType)
  @IsOptional()
  type?: RoomType = RoomType.DIRECT;

  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = false; // Cho CHANNEL: true = công khai, false = riêng tư

  @IsString()
  @IsOptional()
  description?: string; // Mô tả cho channel/group
}
