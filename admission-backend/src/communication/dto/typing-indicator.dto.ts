import { IsString, IsBoolean } from 'class-validator';

export class TypingIndicatorDto {
  @IsString()
  roomId: string;

  @IsBoolean()
  isTyping: boolean;
}
