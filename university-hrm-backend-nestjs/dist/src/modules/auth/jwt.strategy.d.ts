import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    departmentId: string | null;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
        sub: string;
        id: string;
        employeeId: string;
        email: string;
        role: import(".prisma/client").$Enums.SystemRole;
        firstName: string;
        lastName: string;
        departmentId: string | null;
        profilePhoto: string | null;
    }>;
}
export {};
