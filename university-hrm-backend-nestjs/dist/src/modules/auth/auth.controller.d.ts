import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/auth.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, req: Request, res: Response): Promise<{
        accessToken: string;
        user: {
            id: string;
            employeeId: string;
            email: string;
            role: import(".prisma/client").$Enums.SystemRole;
            firstName: string;
            lastName: string;
            profilePhoto: string | null;
            department: {
                id: string;
                name: string;
                code: string;
            } | null;
        };
    }>;
    refresh(req: Request, res: Response): Promise<{
        accessToken: string;
    }>;
    logout(req: Request, res: Response, userId: string): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(dto: ChangePasswordDto, userId: string): Promise<{
        message: string;
    }>;
    me(userId: string): Promise<{
        id: string;
        createdAt: Date;
        department: {
            id: string;
            name: string;
            code: string;
        } | null;
        employeeId: string;
        email: string;
        workEmail: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        personalEmail: string | null;
        dateOfBirth: Date | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        nationality: string | null;
        profilePhoto: string | null;
        bio: string | null;
        skills: string[];
        role: import(".prisma/client").$Enums.SystemRole;
        designation: string | null;
        departmentId: string | null;
        employmentType: import(".prisma/client").$Enums.EmploymentType;
        salary: number | null;
        joinDate: Date | null;
        status: import(".prisma/client").$Enums.EmployeeStatus;
        street: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        pincode: string | null;
        emergencyName: string | null;
        emergencyRelation: string | null;
        emergencyPhone: string | null;
        emergencyEmail: string | null;
    } | null>;
    sessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        ipAddress: string | null;
        userAgent: string | null;
    }[]>;
    revokeSession(sessionId: string, userId: string): Promise<{
        message: string;
    }>;
}
