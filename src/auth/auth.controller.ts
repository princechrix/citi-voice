import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, UnauthorizedException, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';

interface ErrorResponse {
  message: string;
  redirectUrl: string;
}

@ApiTags('Auth')
@Controller('/auth')
export class AuthController { 
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Invalid input or agency ID' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('verify/:token/:userId')
  @ApiOperation({ summary: 'Verify user email' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid verification token' })
  @Redirect('https://citi-voice-frontend-nu.vercel.app/verification/success', 302)
  async verifyEmail(@Param('token') token: string, @Param('userId') userId: string) {
    try {
      const result = await this.authService.verifyEmail(userId, token);
      return { url: result.redirectUrl };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        const errorResponse = error.getResponse() as ErrorResponse;
        return { url: errorResponse.redirectUrl };
      }
      return { url: 'https://citi-voice-frontend-nu.vercel.app/verification/failed' };
    }
  }

  @Post('request-password-reset')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset request sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(requestPasswordResetDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 401, description: 'Invalid reset token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.userId,
      resetPasswordDto.token,
      resetPasswordDto.newPassword
    );
  }

  @Post('reset-password/:token/:userId')
  @Get('reset-password/:token/:userId')
  @ApiOperation({ summary: 'Reset user password using URL token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 401, description: 'Invalid reset token' })
  async resetPasswordWithToken(
    @Param('token') token: string,
    @Param('userId') userId: string,
    @Body() { newPassword }: { newPassword: string } = { newPassword: '' }
  ) {
    if (!newPassword) {
      return { message: 'Token is valid. Please submit your new password.' };
    }
    return this.authService.resetPassword(userId, token, newPassword);
  }
}
