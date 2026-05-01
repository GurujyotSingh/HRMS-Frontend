import { AuditAction } from '@prisma/client';
export declare const AUDIT_KEY = "audit_action";
export declare const Audit: (action: AuditAction) => import("@nestjs/common").CustomDecorator<string>;
