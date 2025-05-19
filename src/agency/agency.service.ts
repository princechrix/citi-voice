import { Injectable } from '@nestjs/common';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class AgencyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAgencyDto: CreateAgencyDto) {
    const agency = await this.prisma.agency.create({
      data: {
        name: createAgencyDto.name,
        acronym: createAgencyDto.acronym,
        description: createAgencyDto.description || '',
        logoUrl: createAgencyDto.logoUrl || '',
      },
      include: {
        users: true,
      },
    });
    return {
      status: 200,
      message: 'Agency created successfully',
      data: agency,
    };
  }

  async findAll() {
    return {
      status: 200,
      message: 'Agencies fetched successfully',
      data: await this.prisma.agency.findMany({
        include: {
          users: true,
        },
        
        orderBy: {
          createdAt: 'desc',
        }
      }),
    };
  }

  async findOne(id: string) {
    return {
      status: 200,
      message: 'Agency fetched successfully',
      data: await this.prisma.agency.findUnique({
        where: { id },
      }),
    };
  }

  async update(id: string, updateAgencyDto: UpdateAgencyDto) {
    return {
      status: 200,
      message: 'Agency updated successfully',
      data: await this.prisma.agency.update({
        where: { id },
        data: updateAgencyDto,
      }),
    };
  }

  async remove(id: string) {
    await this.prisma.agency.delete({
      where: { id },
    });
    return {
      status: 200,
      message: 'Agency deleted successfully',
    };
  }
}
