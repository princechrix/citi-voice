import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  AGENCY_ADMIN = 'AGENCY_ADMIN',
  STAFF = 'STAFF'
}

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'The email of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'The password of the user' })
  @IsString()
  password: string;

  @ApiProperty({ enum: Role, example: Role.STAFF, description: 'The role of the user' })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ required: false, example: '123e4567-e89b-12d3-a456-426614174000', description: 'The agency ID for agency users' })
  @IsOptional()
  @IsString()
  agencyId?: string;
} 
