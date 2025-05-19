import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import AssignComplaintToAgencyDto from './dto/assign-complaint-to-agencyDto.dto';
import { ComplaintStatus } from '@prisma/client';
import { Request as ExpressRequest } from 'express';
import { TransferComplaintDto } from './dto/transfer-complaint.dto';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new complaint' })
  @ApiResponse({
    status: 201,
    description: 'The complaint has been successfully created.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. The request body may contain invalid data.',
  })
  create(@Body() createComplaintDto: CreateComplaintDto) {
    return this.complaintsService.create(createComplaintDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.complaintsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(id);
  }

  @Get('/tracking/:trackingCode')
  findOneByTrackingCode(@Param('trackingCode') trackingCode: string) {
    return this.complaintsService.findOneByTrackingCode(trackingCode);
  }


  @Post('/agency/assign')
  assignComplaintToAgency(@Body() assignComplaintToAgencyDto: AssignComplaintToAgencyDto) {
    return this.complaintsService.assignComplaintToStaff(assignComplaintToAgencyDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/agency/:agencyId')
  findOneByAgencyId(@Param('agencyId') agencyId: string) { 
    return this.complaintsService.findOneByAgencyId(agencyId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/staff/:staffId')
  @ApiOperation({ summary: 'Get all complaints assigned to a staff member' })
  @ApiResponse({
    status: 200,
    description: 'Returns all complaints assigned to the specified staff member',
  })
  @ApiResponse({
    status: 404,
    description: 'Staff member not found',
  })
  findComplaintsByStaffId(@Param('staffId') staffId: string) {
    return this.complaintsService.findComplaintsByStaffId(staffId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateComplaintDto: UpdateComplaintDto,
  ) {
    return this.complaintsService.update(id, updateComplaintDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.complaintsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update complaint status' })
  @ApiResponse({
    status: 200,
    description: 'The complaint status has been successfully updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid status or user not authorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Complaint not found.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(ComplaintStatus),
          description: 'New status for the complaint'
        },
        userId: {
          type: 'string',
          description: 'ID of the user updating the status'
        },
        metadata: {
          type: 'string',
          description: 'Optional note or reason for the status update'
        }
      },
      required: ['status', 'userId']
    },
  })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ComplaintStatus,
    @Body('userId') userId: string,
    @Body('metadata') metadata?: string,
  ) {
    console.log('Received status update request:', { id, status, userId, metadata }); // Debug log

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!status || !Object.values(ComplaintStatus).includes(status)) {
      throw new BadRequestException('Invalid status value');
    }

    return this.complaintsService.updateComplaintStatus(id, status, userId, metadata);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer a complaint to another agency' })
  @ApiResponse({
    status: 200,
    description: 'The complaint has been successfully transferred.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid transfer request or user not authorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Complaint or agency not found.',
  })
  transferComplaint(
    @Param('id') id: string,
    @Body() transferComplaintDto: TransferComplaintDto,
  ) {
    return this.complaintsService.transferComplaint({
      ...transferComplaintDto,
      complaintId: id,
    });
  }
}
