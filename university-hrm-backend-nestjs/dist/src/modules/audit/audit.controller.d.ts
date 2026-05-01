import { AuditService } from './audit.service';
export declare class AuditController {
    private svc;
    constructor(svc: AuditService);
    findAll(q: Record<string, string>): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
        user: {
            email: string;
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
            role: import(".prisma/client").$Enums.SystemRole;
        };
    } & {
        id: string;
        createdAt: Date;
        action: import(".prisma/client").$Enums.AuditAction;
        targetId: string | null;
        targetType: string | null;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        userId: string;
    }>>;
}
