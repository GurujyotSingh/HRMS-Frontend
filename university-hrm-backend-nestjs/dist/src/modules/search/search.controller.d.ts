import { SearchService } from './search.service';
export declare class SearchController {
    private svc;
    constructor(svc: SearchService);
    search(query: string, user: Record<string, unknown>): Promise<{
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
