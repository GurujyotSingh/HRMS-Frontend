import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    login(email: string, password: string, rememberMe: boolean, userAgent?: string, ipAddress?: string): Promise<{
        accessToken: string;
        refreshToken: string;
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
    refresh(refreshTokenValue: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshTokenValue: string, userId: string, userAgent?: string, ipAddress?: string): Promise<void>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    getMe(userId: string): Promise<{
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
    getSessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        ipAddress: string | null;
        userAgent: string | null;
    }[]>;
    revokeSession(sessionId: string, userId: string): Promise<{
        message: string;
    }>;
    private generateAccessToken;
    private createRefreshToken;
}
