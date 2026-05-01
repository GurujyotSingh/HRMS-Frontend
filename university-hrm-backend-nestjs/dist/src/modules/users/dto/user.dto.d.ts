import { SystemRole, EmploymentType, Gender } from '@prisma/client';
import { PaginationDto } from '../../../common/utils/pagination.util';
export declare class CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    workEmail: string;
    phone?: string;
    personalEmail?: string;
    dateOfBirth?: string;
    gender?: Gender;
    nationality?: string;
    role?: SystemRole;
    designation?: string;
    departmentId?: string;
    employmentType?: EmploymentType;
    salary?: number;
    joinDate?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    emergencyName?: string;
    emergencyRelation?: string;
    emergencyPhone?: string;
    emergencyEmail?: string;
    reportingManagerId?: string;
    bio?: string;
    skills?: string[];
}
declare const UpdateUserDto_base: import("@nestjs/common").Type<Partial<CreateUserDto>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
}
export declare class ChangeRoleDto {
    role: SystemRole;
}
export declare class ChangeStatusDto {
    status: string;
    reason?: string;
}
export declare class QueryUsersDto extends PaginationDto {
    search?: string;
    departmentId?: string;
    status?: string;
    employmentType?: string;
    role?: string;
}
export {};
