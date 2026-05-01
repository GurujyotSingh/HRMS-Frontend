import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let error = exception.message;
    let details: Record<string, unknown> | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      error = (resp.message as string) || exception.message;
      if (Array.isArray(resp.message)) {
        error = 'Validation failed';
        details = { errors: resp.message };
      }
    }

    const isProduction = process.env.NODE_ENV === 'production';

    response.status(status).json({
      success: false,
      error,
      statusCode: status,
      ...(details && { details }),
      ...(!isProduction && status === HttpStatus.INTERNAL_SERVER_ERROR && {
        stack: exception.stack,
      }),
    });
  }
}
