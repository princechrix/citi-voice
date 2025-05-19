import { Injectable, ConflictException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}
  async create(createCategoryDto: CreateCategoryDto) {
    if (createCategoryDto.primaryAgencyId) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          primaryAgencyId: createCategoryDto.primaryAgencyId,
        },
      });

      if (existingCategory) {
        throw new ConflictException(`Agency is already assigned as primary to category: ${existingCategory.name}`);
      }
    }

    return await this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        primaryAgencyId: createCategoryDto.primaryAgencyId,
        secondaryAgencies: createCategoryDto.secondaryAgencies
          ? {
              connect: createCategoryDto.secondaryAgencies.map((id) => ({
                id,
              })),
            }
          : undefined,
      },
    });
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        primaryAgency: true,
        secondaryAgencies: true,
      },
    });

    return {
      success: 200,
      message: 'Categories fetched successfully',
      data: categories,
    };
  }

  async findOne(id: string) {
    return await this.prisma.category.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    if (updateCategoryDto.primaryAgencyId) {
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          primaryAgencyId: updateCategoryDto.primaryAgencyId,
          id: { not: id }, // Exclude current category
        },
      });

      if (existingCategory) {
        throw new ConflictException(`Agency is already assigned as primary to category: ${existingCategory.name}`);
      }
    }

    return await this.prisma.category.update({
      where: { id },
      data: {
        name: updateCategoryDto.name,
        description: updateCategoryDto.description,
        primaryAgencyId: updateCategoryDto.primaryAgencyId,
        secondaryAgencies: {
          set: [],
          connect: updateCategoryDto.secondaryAgencies?.map((id) => ({ id })) || [],
        },
      },
    });
  }

  async remove(id: string) {
    return await this.prisma.category.delete({
      where: { id },
    });
  }
}
