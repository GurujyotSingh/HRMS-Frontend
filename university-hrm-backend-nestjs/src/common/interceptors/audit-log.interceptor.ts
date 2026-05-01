import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AUDIT_KEY } from '../decorators/audit.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';

const SENSITIVE_FIELDS = ['passwordHash', 'password', 'token', 'refreshToken', 'resetToken'];

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return obj;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      clean[key] = '[REDACTED]';
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.get<AuditAction>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap((responseData) => {
        const userId = request.user?.sub || request.user?.id;
        if (!userId) return;

        const targetId =
          request.params?.id ||
          (responseData as Record<string, unknown>)?.id ||
          null;

        // Fire and forget — do not block the response
        this.prisma.auditLog
          .create({
            data: {
              userId,
              action,
              targetId: targetId ? String(targetId) : null,
              targetType: context.getClass().name.replace('Controller', ''),
              details: request.body ? sanitize(request.body) as Prisma.InputJsonValue : undefined,
              ipAddress: request.ip || request.connection?.remoteAddress,
              userAgent: request.headers?.['user-agent'] || null,
            },
          })
          .catch((err) => {
            console.error('Audit log write failed:', err.message);
          });
      }),
    );
  }
}
