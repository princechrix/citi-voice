import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception.code === 'P2002') { 
      status = HttpStatus.CONFLICT;
      const target = exception.meta?.target as string[] | undefined;
      const field = target?.[0];
      message = field === 'email' 
        ? 'Email already exists'
        : `A record with this ${field} already exists`;
    } else if (exception.code === 'P2003') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid foreign key reference';
    } else if (exception.code === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      message = 'Record not found';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.code,
    });
  }
} 