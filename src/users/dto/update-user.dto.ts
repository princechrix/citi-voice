import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class UpdateUserDto {
  @ApiProperty({ required: false, example: 'John Doe', description: 'The name of the user' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, example: 'john@example.com', description: 'The email of the user' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false, example: 'password123', description: 'The password of the user' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ required: false, description: 'The role of the user', enum: Role })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ required: false, example: '123e4567-e89b-12d3-a456-426614174000', description: 'The agency ID for agency users' })
  @IsOptional()
  @IsUUID()
  agencyId?: string;

  @ApiProperty({ required: false, example: true, description: 'Whether the user is active' })
  @IsOptional()
  isActive?: boolean;
} 