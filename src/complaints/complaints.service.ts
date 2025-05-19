import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  Agency,
  ComplaintStatus,
  ComplaintHistoryAction,
  Role,
} from '@prisma/client';
import AssignComplaintToAgencyDto from './dto/assign-complaint-to-agencyDto.dto';
import { TransferComplaintDto } from './dto/transfer-complaint.dto';

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private generateTrackingCode(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const part1 = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const part2 = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const part3 = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `CITIVOICE-${part1}-${part2}-${part3}-${timestamp.slice(-4)}-${random}`;
  }

  async create(createComplaintDto: CreateComplaintDto) {
    const trackingCode = this.generateTrackingCode();

    // First, find the first admin of the agency
    const agencyAdmin = await this.prisma.user.findFirst({
      where: {
        agencyId: createComplaintDto.agencyId,
        role: Role.AGENCY_ADMIN,
      },
    });

    if (!agencyAdmin) {
      throw new Error('No admin found for the agency');
    }

    // Create the complaint with the assignment
    const complaint = await this.prisma.complaint.create({
      data: {
        ...createComplaintDto,
        trackingCode,
        assignedTo: {
          create: {
            staffId: agencyAdmin.id,
            assignedAt: new Date(),
          },
        },
      },
      include: {
        agency: true,
        assignedTo: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!complaint.agency) {
      throw new Error('Agency not found for the complaint');
    }

    const agency = complaint.agency;

    // Create complaint history record for creation
    await this.prisma.complaintHistory.create({
      data: {
        complaintId: complaint.id,
        fromUserId: null,
        toUserId: null,
        fromAgencyId: agency.id,
        toAgencyId: agency.id,
        action: ComplaintHistoryAction.SUBMITTED,
        metadata: 'Complaint submitted by citizen',
      },
    });

    // Create complaint history record for initial assignment
    await this.prisma.complaintHistory.create({
      data: {
        complaintId: complaint.id,
        fromUserId: null,
        toUserId: agencyAdmin.id,
        fromAgencyId: agency.id,
        toAgencyId: agency.id,
        action: ComplaintHistoryAction.ASSIGNED,
        metadata: 'Initial assignment to agency admin',
      },
    });

    // Send confirmation email to citizen
    await this.mailService.sendComplaintConfirmationEmail(
      complaint.citizenEmail,
      complaint.citizenName,
      trackingCode,
      agency.name,
      agency.logoUrl,
      `http://localhost:3000/track/${trackingCode}`,
    );

    // Send assignment email to admin
    await this.mailService.sendComplaintAssignmentEmail(
      agencyAdmin.email,
      agencyAdmin.name,
      complaint.subject,
      agency.name,
      trackingCode,
    );

    return {
      status: 200,
      message: 'Complaint created and assigned successfully',
      complaint,
    };
  }

  async findAll() {
    const complaints = await this.prisma.complaint.findMany({
      include: {
        agency: true,
        category: true,
        assignedTo: {
          include: {
            staff: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: 200,
      message: 'Complaints fetched successfully',
      data: complaints,
    };
  }

  async findOne(id: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        agency: true,
        category: true,
      },
    });

    return {
      success: true,
      message: 'Complaint fetched successfully',
      data: complaint,
    };
  }

  async findOneByTrackingCode(trackingCode: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { trackingCode },
      include: {
        agency: true,
        category: true,
      },
    });

    return {
      success: true,
      message: 'Complaint fetched successfully',
      data: complaint,
    };
  }

  async findOneByAgencyId(agencyId: string) {
    const complaints = await this.prisma.complaint.findMany({
      where: { agencyId },
      include: {
        agency: true,
        category: true,
        assignedTo: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      message: 'Complaints fetched successfully',
      data: complaints,
    };
  }

  async findComplaintsByStaffId(staffId: string) {
    const complaints = await this.prisma.complaint.findMany({
      where: {
        assignedTo: {
          staffId: staffId,
        },
      },
      include: {
        agency: true,
        category: true,
        assignedTo: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      message: 'Staff complaints fetched successfully',
      data: complaints,
    };
  }

  async assignComplaintToStaff(
    assignComplaintToAgencyDto: AssignComplaintToAgencyDto,
  ) {
    const { complaintId, staffId } = assignComplaintToAgencyDto;

    // Start a transaction to ensure data consistency
    return this.prisma.$transaction(async (prisma) => {
      // Get the complaint and verify it exists
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
        include: {
          agency: true,
          assignedTo: true,
        },
      });

      if (!complaint) {
        throw new NotFoundException('Complaint not found');
      }

      // Get the staff member and verify they exist
      const staffMember = await prisma.user.findUnique({
        where: { id: staffId },
      });

      if (!staffMember) {
        throw new NotFoundException('Staff member not found');
      }

      // Verify the staff member belongs to the same agency as the complaint
      if (staffMember.agencyId !== complaint.agencyId) {
        throw new BadRequestException(
          'Staff member does not belong to the complaint agency',
        );
      }

      // Get the current assignment if it exists
      const currentAssignment = complaint.assignedTo;

      // Create or update the assignment
      const assignment = await prisma.assignment.upsert({
        where: { complaintId },
        create: {
          complaintId,
          staffId,
        },
        update: {
          staffId,
          assignedAt: new Date(),
        },
      });

      // Create complaint history record
      await prisma.complaintHistory.create({
        data: {
          complaintId,
          fromUserId: currentAssignment?.staffId || null,
          toUserId: staffId,
          fromAgencyId: currentAssignment ? complaint.agencyId : null,
          toAgencyId: complaint.agencyId,
          action: currentAssignment
            ? ComplaintHistoryAction.REASSIGNED
            : ComplaintHistoryAction.ASSIGNED,
        },
      });

      // Update complaint status if it was pending
      if (complaint.status === ComplaintStatus.PENDING) {
        await prisma.complaint.update({
          where: { id: complaintId },
          data: { status: ComplaintStatus.IN_PROGRESS },
        });
      }

      // Send email notification to the assigned staff member
      await this.mailService.sendComplaintAssignmentEmail(
        staffMember.email,
        staffMember.name,
        complaint.subject,
        complaint.agency.name,
        complaint.trackingCode || '',
      );

      return {
        success: true,
        message: 'Complaint assigned to staff successfully',
        data: {
          assignment,
          complaint: {
            ...complaint,
            status:
              complaint.status === ComplaintStatus.PENDING
                ? ComplaintStatus.IN_PROGRESS
                : complaint.status,
          },
        },
      };
    });
  }

  async getComplaintAssignment(complaintId: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { complaintId },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('No assignment found for this complaint');
    }

    return {
      success: true,
      message: 'Assignment fetched successfully',
      data: assignment,
    };
  }

  async getComplaintHistory(complaintId: string) {
    const history = await this.prisma.complaintHistory.findMany({
      where: { complaintId },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        fromAgency: {
          select: {
            id: true,
            name: true,
            acronym: true,
            logoUrl: true,
          },
        },
        toAgency: {
          select: {
            id: true,
            name: true,
            acronym: true,
            logoUrl: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return {
      success: true,
      message: 'Complaint history fetched successfully',
      data: history,
    };
  }

  async update(id: string, updateComplaintDto: UpdateComplaintDto) {
    return await this.prisma.complaint.update({
      where: { id },
      data: updateComplaintDto,
    });
  }

  async remove(id: string) {
    return await this.prisma.complaint.delete({
      where: { id },
    });
  }

  private mapStatusToHistoryAction(status: ComplaintStatus): ComplaintHistoryAction {
    switch (status) {
      case ComplaintStatus.RESOLVED:
        return ComplaintHistoryAction.RESOLVED;
      case ComplaintStatus.REJECTED:
        return ComplaintHistoryAction.REJECTED;
      case ComplaintStatus.IN_PROGRESS:
        return ComplaintHistoryAction.IN_PROGRESS;
      default:
        return ComplaintHistoryAction.SUBMITTED;
    }
  }

  async updateComplaintStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    userId: string,
    metadata?: string,
  ) {
    try {
      // Get the complaint and verify it exists
      const complaint = await this.prisma.complaint.findUnique({
        where: { id: complaintId },
        include: {
          agency: true,
          assignedTo: {
            include: {
              staff: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!complaint) {
        throw new NotFoundException('Complaint not found');
      }

      // Get the user who is making the status change
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify the user belongs to the same agency as the complaint
      if (user.agencyId !== complaint.agencyId) {
        throw new BadRequestException(
          'User does not belong to the complaint agency',
        );
      }

      // First update the complaint status
      const updatedComplaint = await this.prisma.complaint.update({
        where: { id: complaintId },
        data: {
          status: newStatus,
        },
        include: {
          agency: true,
          assignedTo: {
            include: {
              staff: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      // Then create the history record
      await this.prisma.complaintHistory.create({
        data: {
          complaintId,
          fromUserId: userId,
          toUserId: complaint.assignedTo?.staffId || null,
          fromAgencyId: complaint.agencyId,
          toAgencyId: complaint.agencyId,
          action: this.mapStatusToHistoryAction(newStatus),
          metadata: metadata || `Status updated to ${newStatus}`,
        },
      });

      // Send email notification to the assigned staff member
      if (complaint.assignedTo?.staff) {
        await this.mailService.sendComplaintAssignmentEmail(
          complaint.assignedTo.staff.email,
          complaint.assignedTo.staff.name,
          complaint.subject,
          complaint.agency.name,
          complaint.trackingCode || '',
        );
      }

      // Send email notification to the citizen about status change
      await this.mailService.sendComplaintStatusUpdateEmail(
        complaint.citizenEmail,
        complaint.citizenName,
        complaint.subject,
        complaint.agency.name,
        complaint.trackingCode || '',
        complaint.agency.logoUrl || '',
        newStatus,
      );

      return {
        success: true,
        message: 'Complaint status updated successfully',
        data: updatedComplaint,
      };
    } catch (error) {
      console.error('Error updating complaint status:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to update complaint status: ${error}`);
    }
  }

  async transferComplaint(transferComplaintDto: TransferComplaintDto) {
    return this.prisma.$transaction(async (prisma) => {
      const { complaintId, targetAgencyId, userId, transferReason } =
        transferComplaintDto;

      // Get the complaint and verify it exists
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
        include: {
          agency: true,
          assignedTo: {
            include: {
              staff: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!complaint) {
        throw new NotFoundException(
          `Complaint with ID ${complaintId} not found`,
        );
      }

      // Get the user who is initiating the transfer
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Verify the user belongs to the current agency
      if (user.agencyId !== complaint.agencyId) {
        throw new BadRequestException(
          'User does not belong to the current agency',
        );
      }

      // Get the target agency
      const targetAgency = await prisma.agency.findUnique({
        where: { id: targetAgencyId },
      });

      if (!targetAgency) {
        throw new NotFoundException(
          `Target agency with ID ${targetAgencyId} not found`,
        );
      }

      // Create complaint history record for transfer
      await prisma.complaintHistory.create({
        data: {
          complaintId,
          fromUserId: userId,
          toUserId: null, // No specific staff assigned yet
          fromAgencyId: complaint.agencyId,
          toAgencyId: targetAgencyId,
          action: ComplaintHistoryAction.TRANSFERRED,
          metadata: transferReason,
        },
      });

      // Update the complaint with new agency
      const updatedComplaint = await prisma.complaint.update({
        where: { id: complaintId },
        data: {
          agencyId: targetAgencyId,
          status: ComplaintStatus.PENDING, // Reset status to pending for new agency
          assignedTo: {
            delete: true, // Remove current assignment
          },
        },
        include: {
          agency: true,
          assignedTo: {
            include: {
              staff: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      // Send email notification to the citizen about the transfer
      await this.mailService.sendComplaintTransferEmail(
        complaint.citizenEmail,
        complaint.citizenName,
        complaint.subject,
        targetAgency.name,
        targetAgency.logoUrl,
        complaint.trackingCode || '',
        transferReason,
      );

      return {
        success: true,
        message: 'Complaint transferred successfully',
        data: updatedComplaint,
      };
    });
  }
}
