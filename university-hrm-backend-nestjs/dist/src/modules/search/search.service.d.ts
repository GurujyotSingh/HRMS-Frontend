import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole } from '@prisma/client';
export declare class SearchService {
    private prisma;
    constructor(prisma: PrismaService);
    globalSearch(query: string, currentUser: {
        role: SystemRole;
        departmentId: string | null;
    }): Promise<{
        employees: {
            id: string;
            department: {
                name: string;
            } | null;
            employeeId: string;
            email: string;
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
            role: import(".prisma/client").$Enums.SystemRole;
            designation: string | null;
        }[];
        departments: {
            id: string;
            name: string;
            code: string;
        }[];
        announcements: {
            id: string;
            title: string;
            priority: import(".prisma/client").$Enums.AnnouncementPriority;
            publishedAt: Date;
        }[];
    }>;
}
