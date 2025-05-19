import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'The email of the user' })
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ enum: Role, example: Role.STAFF, description: 'The role of the user' })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ required: false, example: '123e4567-e89b-12d3-a456-426614174000', description: 'The agency ID for agency users' })
  @IsOptional()
  @IsUUID()
  agencyId?: string;

  @ApiProperty({ example: 'no example 😅', description: 'The secret key for registration' })
  @IsString()
  secretKey: string;
} 
