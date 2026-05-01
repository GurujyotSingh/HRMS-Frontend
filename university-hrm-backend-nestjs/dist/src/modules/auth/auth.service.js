"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const password_util_1 = require("../../common/utils/password.util");
const uuid_1 = require("uuid");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async login(email, password, rememberMe, userAgent, ipAddress) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { department: { select: { id: true, name: true, code: true } } },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            throw new common_1.HttpException(`Account is locked. Try again in ${minutesLeft} minutes.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const isValid = await (0, password_util_1.comparePassword)(password, user.passwordHash);
        if (!isValid) {
            const failedAttempts = user.failedLoginAttempts + 1;
            const updateData = { failedLoginAttempts: failedAttempts };
            if (failedAttempts >= 5) {
                updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: updateData,
            });
            await this.prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'FAILED_LOGIN',
                    ipAddress,
                    userAgent,
                    details: { reason: 'Invalid password', attempt: failedAttempts },
                },
            });
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (user.status !== 'ACTIVE') {
            throw new common_1.ForbiddenException('Your account is not active. Contact HR.');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
        });
        const accessToken = this.generateAccessToken(user);
        const { token: refreshToken, id: tokenId } = await this.createRefreshToken(user.id, rememberMe, userAgent, ipAddress);
        await this.prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                ipAddress,
                userAgent,
            },
        });
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                employeeId: user.employeeId,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePhoto: user.profilePhoto,
                department: user.department,
            },
        };
    }
    async refresh(refreshTokenValue) {
        if (!refreshTokenValue) {
            throw new common_1.UnauthorizedException('Refresh token not provided');
        }
        const tokenRecord = await this.prisma.refreshToken.findUnique({
            where: { token: refreshTokenValue },
            include: { user: true },
        });
        if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        try {
            this.jwt.verify(refreshTokenValue, {
                secret: this.config.get('jwt.refreshSecret'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        await this.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { isRevoked: true, revokedAt: new Date() },
        });
        const user = tokenRecord.user;
        const accessToken = this.generateAccessToken(user);
        const { token: newRefreshToken } = await this.createRefreshToken(user.id, false, tokenRecord.userAgent || undefined, tokenRecord.ipAddress || undefined);
        return { accessToken, refreshToken: newRefreshToken };
    }
    async logout(refreshTokenValue, userId, userAgent, ipAddress) {
        if (refreshTokenValue) {
            await this.prisma.refreshToken.updateMany({
                where: { token: refreshTokenValue, userId },
                data: { isRevoked: true, revokedAt: new Date() },
            });
        }
        await this.prisma.auditLog.create({
            data: {
                userId,
                action: 'LOGOUT',
                ipAddress,
                userAgent,
            },
        });
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (user) {
            const resetToken = (0, uuid_1.v4)();
            const resetTokenHash = await bcrypt.hash(resetToken, 10);
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken: resetTokenHash,
                    resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
                },
            });
            console.log(`Password reset token for ${email}: ${resetToken}`);
        }
        return { message: 'If this email exists, a reset link has been sent' };
    }
    async resetPassword(token, newPassword) {
        const users = await this.prisma.user.findMany({
            where: {
                resetTokenExpiry: { gt: new Date() },
                resetToken: { not: null },
            },
        });
        let matchedUser = null;
        for (const user of users) {
            if (user.resetToken && await bcrypt.compare(token, user.resetToken)) {
                matchedUser = user;
                break;
            }
        }
        if (!matchedUser) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const passwordHash = await (0, password_util_1.hashPassword)(newPassword);
        await this.prisma.user.update({
            where: { id: matchedUser.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        await this.prisma.refreshToken.updateMany({
            where: { userId: matchedUser.id },
            data: { isRevoked: true, revokedAt: new Date() },
        });
        return { message: 'Password reset successful' };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, passwordHash: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const isValid = await (0, password_util_1.comparePassword)(currentPassword, user.passwordHash);
        if (!isValid)
            throw new common_1.BadRequestException('Current password is incorrect');
        const passwordHash = await (0, password_util_1.hashPassword)(newPassword);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
        await this.prisma.auditLog.create({
            data: { userId, action: 'PASSWORD_CHANGED' },
        });
        return { message: 'Password changed successfully' };
    }
    async getMe(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                employeeId: true,
                firstName: true,
                lastName: true,
                email: true,
                workEmail: true,
                phone: true,
                personalEmail: true,
                dateOfBirth: true,
                gender: true,
                nationality: true,
                profilePhoto: true,
                bio: true,
                skills: true,
                role: true,
                designation: true,
                departmentId: true,
                department: { select: { id: true, name: true, code: true } },
                employmentType: true,
                salary: true,
                joinDate: true,
                status: true,
                street: true,
                city: true,
                state: true,
                country: true,
                pincode: true,
                emergencyName: true,
                emergencyRelation: true,
                emergencyPhone: true,
                emergencyEmail: true,
                createdAt: true,
            },
        });
    }
    async getSessions(userId) {
        return this.prisma.refreshToken.findMany({
            where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
            select: {
                id: true,
                userAgent: true,
                ipAddress: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async revokeSession(sessionId, userId) {
        const token = await this.prisma.refreshToken.findFirst({
            where: { id: sessionId, userId },
        });
        if (!token) {
            throw new common_1.BadRequestException('Session not found');
        }
        await this.prisma.refreshToken.update({
            where: { id: sessionId },
            data: { isRevoked: true, revokedAt: new Date() },
        });
        return { message: 'Session revoked' };
    }
    generateAccessToken(user) {
        return this.jwt.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId,
        });
    }
    async createRefreshToken(userId, rememberMe, userAgent, ipAddress) {
        const expiresIn = rememberMe ? '30d' : (this.config.get('jwt.refreshExpiresIn') || '7d');
        const expiresMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        const tokenId = (0, uuid_1.v4)();
        const signOptions = {
            secret: this.config.get('jwt.refreshSecret') || 'fallback-refresh',
            expiresIn,
        };
        const token = this.jwt.sign({ sub: userId, tokenId }, signOptions);
        const record = await this.prisma.refreshToken.create({
            data: {
                token,
                userId,
                userAgent,
                ipAddress,
                expiresAt: new Date(Date.now() + expiresMs),
            },
        });
        return { token, id: record.id };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map