import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(query: Record<string, unknown>): Promise<import("../../common/utils/pagination.util").PaginatedResult<{
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
        details: Prisma.JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        userId: string;
    }>>;
}
