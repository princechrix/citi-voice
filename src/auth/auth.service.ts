import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { MailService } from '../mail/mail.service';
import { TokenExpiredError } from '@nestjs/jwt';

interface VerificationTokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mailService: MailService,
  ) {}

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

  async register(data: RegisterDto) {
    // Validate secret key
    if (data.secretKey !== process.env.REGISTRATION_SECRET_KEY) {
      throw new InternalServerErrorException('Invalid registration secret key');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    try {
      const generatedPassword = this.generateRandomPassword();
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      const user = await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role,
          ...(data.agencyId && { agencyId: data.agencyId }),
        },
      });

      const { password: _, ...userWithoutPassword } = user;

      // Generate verification token that expires in 15 minutes
      const verificationToken = await this.jwt.signAsync(
        {
          sub: user.id,
          generatedPassword, // Include the generated password in the token
        },
        { expiresIn: '15m' },
      );

      await this.mailService.sendVerificationEmail(
        user.email,
        user.name,
        `http://localhost:3001/api/v1/auth/verify/${verificationToken}/${user.id}`,
      );

      return userWithoutPassword;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid agency ID provided');
        }
      }
      throw error;
    }
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        agency: true,
      },
    });

    if (!user) throw new UnauthorizedException('Wrong email or password');
    if (!user.password)
      throw new UnauthorizedException('Wrong email or password');

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Wrong email or password');

    const token = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        isTempPassword: user.isTempPassword,
        agencyId: user.agencyId,
        agency: user.agency,
      },
    };
  }

  async verifyEmail(userId: string, token: string) {
    try {
      // Verify the token
      const payload = await this.jwt.verifyAsync<
        VerificationTokenPayload & { generatedPassword: string }
      >(token);

      // Check if the token's user ID matches the requested user ID
      if (payload.sub !== userId) {
        throw new UnauthorizedException({
          message: 'Invalid verification token',
          redirectUrl: 'http://localhost:3000/verification/failed',
        });
      }

      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException({
          message: 'User not found',
          redirectUrl: 'http://localhost:3000/verification/failed',
        });
      }

      // Update user's verified status
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });

      // Send welcome email with credentials
      await this.mailService.sendWelcomeEmail(
        user.email,
        user.name,
        user.email, // username is the email
        payload.generatedPassword, // Use the password from the token
      );

      return {
        message: 'Email verified successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        },
        redirectUrl: 'http://localhost:3000/verification/success',
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException({
          message: 'Verification token has expired',
          redirectUrl: 'http://localhost:3000/verification/failed',
        });
      }
      throw new UnauthorizedException({
        message: 'Invalid verification token',
        redirectUrl: 'http://localhost:3000/verification/failed',
      });
    }
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user doesn't exist for security
      return {
        message:
          'If an account exists with this email, you will receive a password reset link',
      };
    }

    // Generate reset token that expires in 15 minutes
    const resetToken = await this.jwt.signAsync(
      { sub: user.id },
      { expiresIn: '15m' },
    );

    // Send reset email
    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.name,
      `http://localhost:3000/reset/new?token=${resetToken}&userId=${user.id}`,
    );

    return {
      message:
        'If an account exists with this email, you will receive a password reset link',
    };
  }

  async resetPassword(userId: string, token: string, newPassword: string) {
    try {
      // Verify the token
      const payload =
        await this.jwt.verifyAsync<VerificationTokenPayload>(token);

      // Check if the token's user ID matches the requested user ID
      if (payload.sub !== userId) {
        throw new UnauthorizedException('Invalid reset token');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user's password and set isTempPassword to false
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          isTempPassword: false,
        },
      });

      return {
        message: 'Password reset successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isTempPassword: user.isTempPassword,
        },
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Reset token has expired');
      }
      throw new UnauthorizedException('Invalid reset token');
    }
  }
}
