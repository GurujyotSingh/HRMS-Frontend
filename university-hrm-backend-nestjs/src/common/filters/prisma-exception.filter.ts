import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected database error occurred';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const fields = (exception.meta?.target as string[]) || [];
        message = `A record with this ${fields.join(', ')} already exists`;
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference: related record does not exist';
        break;
      }
      case 'P2014': {
        status = HttpStatus.BAD_REQUEST;
        message = 'The change you are trying to make would violate a required relation';
        break;
      }
      default:
        break;
    }

    response.status(status).json({
      success: false,
      error: message,
      statusCode: status,
    });
  }
}
