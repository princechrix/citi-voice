import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateComplaintHistoryDto } from './dto/create-complaint-history.dto';
import { UpdateComplaintHistoryDto } from './dto/update-complaint-history.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplaintHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  create(createComplaintHistoryDto: CreateComplaintHistoryDto) {
    return 'This action adds a new complaintHistory';
  }

  async findAll() {
    const histories = await this.prisma.complaintHistory.findMany({
      include: {
        complaint: {
          select: {
            id: true,
            subject: true,
            trackingCode: true,
            status: true,
          },
        },
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
          },
        },
        toAgency: {
          select: {
            id: true,
            name: true,
            acronym: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return {
      success: true,
      message: 'Complaint histories fetched successfully',
      data: histories,
    };
  }

  async findOne(id: string) {
    const histories = await this.prisma.complaintHistory.findMany({
      where: { complaintId: id },
      include: {
        complaint: {
          select: {
            id: true,
            subject: true,
            trackingCode: true,
            status: true,
          },
        },
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

    if (!histories.length) {
      throw new NotFoundException(
        `No complaint histories found for complaint ID ${id}`,
      );
    }

    return {
      success: true,
      message: 'Complaint histories fetched successfully',
      data: histories,
    };
  }

  update(id: number, updateComplaintHistoryDto: UpdateComplaintHistoryDto) {
    return `This action updates a #${id} complaintHistory`;
  }

  remove(id: number) {
    return `This action removes a #${id} complaintHistory`;
  }
}
