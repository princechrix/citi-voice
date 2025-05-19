import {
  IsString,
  IsUUID,
  IsEmail,
  IsNotEmpty
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateComplaintDto {
  @ApiProperty({ description: 'The subject of the complaint' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'The description of the complaint' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'The email of the citizen' })
  @IsEmail()
  @IsNotEmpty()
  citizenEmail: string;

  @ApiProperty({ description: 'The name of the citizen' })
  @IsString()
  @IsNotEmpty()
  citizenName: string;

  @ApiProperty({ description: 'The category of the complaint' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'The agency of the complaint' })
  @IsUUID()
  @IsNotEmpty()
  agencyId: string;
}
