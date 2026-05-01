import { PrismaService } from '../../prisma/prisma.service';
export declare class DepartmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        headCount: number;
        _count: undefined;
        director: {
            id: string;
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
        } | null;
        id: string;
        updatedAt: Date;
        name: string;
        code: string;
        directorId: string | null;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        director: {
            id: string;
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
        } | null;
        employees: {
            id: string;
            employeeId: string;
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
            role: import(".prisma/client").$Enums.SystemRole;
            designation: string | null;
            status: import(".prisma/client").$Enums.EmployeeStatus;
        }[];
    } & {
        id: string;
        updatedAt: Date;
        name: string;
        code: string;
        directorId: string | null;
        createdAt: Date;
    }>;
    create(data: {
        name: string;
        code: string;
        directorId?: string;
    }): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        code: string;
        directorId: string | null;
        createdAt: Date;
    }>;
    update(id: string, data: {
        name?: string;
        code?: string;
        directorId?: string;
    }): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        code: string;
        directorId: string | null;
        createdAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        code: string;
        directorId: string | null;
        createdAt: Date;
    }>;
}
