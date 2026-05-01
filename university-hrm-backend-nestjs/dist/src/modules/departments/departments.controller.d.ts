import { DepartmentsService } from './departments.service';
declare class CreateDepartmentDto {
    name: string;
    code: string;
    directorId?: string;
}
declare class UpdateDepartmentDto {
    name?: string;
    code?: string;
    directorId?: string;
}
export declare class DepartmentsController {
    private departmentsService;
    constructor(departmentsService: DepartmentsService);
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
    create(dto: CreateDepartmentDto): Promise<{
        id: string;
        updatedAt: Date;
        name: string;
        code: string;
        directorId: string | null;
        createdAt: Date;
    }>;
    update(id: string, dto: UpdateDepartmentDto): Promise<{
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
export {};
