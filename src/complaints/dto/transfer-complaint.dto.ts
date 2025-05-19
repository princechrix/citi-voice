import { IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferComplaintDto {
  @ApiProperty({ description: 'The ID of the complaint to transfer' })
  @IsString()
  @IsNotEmpty()
  complaintId: string;

  @ApiProperty({ description: 'The ID of the agency to transfer the complaint to' })
  @IsUUID()
  @IsNotEmpty()
  targetAgencyId: string;

  @ApiProperty({ description: 'The ID of the user initiating the transfer' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Optional reason for the transfer' })
  @IsString()
  transferReason?: string;
} 