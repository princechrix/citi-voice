import { IsString, IsUUID } from "class-validator";
import { IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
class AssignComplaintToAgencyDto {
  @ApiProperty({ description: 'The ID of the complaint to assign' })
  @IsString()
  @IsNotEmpty()
  complaintId: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID() 
  @ApiProperty({ description: 'The ID of the staff member to assign the complaint to' })
  staffId: string;
}

export default AssignComplaintToAgencyDto;
