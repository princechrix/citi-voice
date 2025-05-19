import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAgencyDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of the agency' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The acronym of the agency' })
  acronym: string;

  @IsString()
  @ApiProperty({ description: 'The description of the agency' })
  @IsOptional()
  description?: string;

  @IsString()
  @ApiProperty({ description: 'The logo of the agency' })
  @IsOptional()
  logoUrl?: string;
}
