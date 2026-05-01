import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '@prisma/client';

export const AUDIT_KEY = 'audit_action';
export const Audit = (action: AuditAction) => SetMetadata(AUDIT_KEY, action);
