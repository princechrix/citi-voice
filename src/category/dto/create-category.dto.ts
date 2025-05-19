import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsString()
  @ApiProperty({ description: 'The name of the category' })
  name: string;

  @IsString()
  @ApiProperty({ description: 'The description of the category' })
  description: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ description: 'The primary agency ID of the category' })
  primaryAgencyId?: string;

  @IsOptional()
  @IsUUID('4', { each: true })
  @ApiProperty({ description: 'The secondary agency IDs of the category' })
  secondaryAgencies?: string[];
}
