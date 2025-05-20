import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mailService: MailService,
  ) {}

  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Returns an array of users' })
  async findAll() {
    return {
      status: 200,
      message: 'Users fetched successfully',
      data: await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          agencyId: true,
          isVerified: true,
          isActive: true,
          isTempPassword: true,
          createdAt: true,
          agency: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
    };
  }

  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Returns the found user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        agencyId: true,
        isVerified: true,
        isActive: true,
        isTempPassword: true,
        createdAt: true,
        agency: true      
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: 200,
      message: 'User fetched successfully',
      data: user,
    };
  }

  @ApiOperation({ summary: 'Get a user by agency ID' })
  @ApiResponse({ status: 200, description: 'Returns the found user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOneByAgencyId(agencyId: string) {
    const users = await this.prisma.user.findMany({ where: { agencyId } }); 
    return { 
      status: 200,
      message: 'Users fetched successfully',
      data: users,
    };
  }

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(data: CreateUserDto) {
    // Generate a random password
    const generatedPassword = data.password || this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    
    const user = await this.prisma.user.create({ 
      data : {
        ...data,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        agencyId: true,
        isVerified: true,
        isActive: true,
        isTempPassword: true,
        createdAt: true,
        agency: true
      }
    });



    // Generate verification token that expires in 15 minutes
    const verificationToken = await this.jwt.signAsync(
      {
        sub: user.id,
        password: generatedPassword, // Include the password in the token
      },
      { expiresIn: '15m' },
    );

    // Send verification email
    await this.mailService.sendVerificationEmail(
      user.email,
      user.name,
      `https://citi-voice.onrender.com/api/v1/auth/verify/${verificationToken}/${user.id}`,
    );

    return {
      status: 201,
      message: 'User created successfully',
      data: user,
    };
  }

  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(id: string, data: UpdateUserDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If password is provided, hash it
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        agencyId: true,
        isVerified: true,
        isActive: true,
        isTempPassword: true,
        createdAt: true,
        agency: true
      }
    });

    return {
      status: 200,
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  @ApiOperation({ summary: 'Bulk create users' })
  @ApiResponse({ status: 201, description: 'Users successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async bulkCreate(data: BulkCreateUsersDto) {
    // Process users in a transaction to ensure all-or-nothing creation
    const users = await this.prisma.$transaction(async (prisma) => {
      const createdUsers: Omit<User, 'password'>[] = [];
      
      // Check for existing emails first
      for (const userData of data.users) {
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });
        
        if (existingUser) {
          throw new ConflictException(`User with email ${userData.email} already exists`);
        }
      }
      
      for (const userData of data.users) {
        // Generate a random password if not provided
        const generatedPassword = userData.password || this.generateRandomPassword();
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const user = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            agencyId: true,
            isVerified: true,
            isActive: true,
            isTempPassword: true,
            createdAt: true,
            agency: true
          }
        });
        
        // Generate verification token that expires in 15 minutes
        const verificationToken = await this.jwt.signAsync(
          {
            sub: user.id,
            generatedPassword, // Include the generated password in the token
          },
          { expiresIn: '15m' },
        );

        // Send verification email
        await this.mailService.sendVerificationEmail(
          user.email,
          user.name,
          `https://citi-voice.onrender.com/api/v1/auth/verify/${verificationToken}/${user.id}`,
        );
        
        createdUsers.push(user);
      }

      return createdUsers;
    });

    return {
      status: 201,
      message: `${users.length} users created successfully`,
      data: users,
    };
  }

  private generateRandomPassword(length: number = 8): string {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(id: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete the user
    await this.prisma.user.delete({
      where: { id }
    });

    return {
      status: 200,
      message: 'User deleted successfully'
    };
  }
}
