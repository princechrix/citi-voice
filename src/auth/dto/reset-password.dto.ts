import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The ID of the user' })
  @IsString()
  userId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The token of the user' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'password123', description: 'The new password of the user' })
  @IsString()
  @MinLength(8)
  newPassword: string;
} 