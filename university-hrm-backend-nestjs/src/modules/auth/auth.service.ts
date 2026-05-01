import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { hashPassword, comparePassword } from '../../common/utils/password.util';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(
    email: string,
    password: string,
    rememberMe: boolean,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { department: { select: { id: true, name: true, code: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new HttpException(
        `Account is locked. Try again in ${minutesLeft} minutes.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Verify password
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: Record<string, unknown> = { failedLoginAttempts: failedAttempts };

      if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Log failed login
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'FAILED_LOGIN',
          ipAddress,
          userAgent,
          details: { reason: 'Invalid password', attempt: failedAttempts },
        },
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Your account is not active. Contact HR.');
    }

    // Reset failed attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const { token: refreshToken, id: tokenId } = await this.createRefreshToken(
      user.id,
      rememberMe,
      userAgent,
      ipAddress,
    );

    // Log successful login
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

  async refresh(refreshTokenValue: string) {
    if (!refreshTokenValue) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    // Find the token record
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Verify JWT signature
    try {
      this.jwt.verify(refreshTokenValue, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate: revoke old, create new
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    const user = tokenRecord.user;
    const accessToken = this.generateAccessToken(user);
    const { token: newRefreshToken } = await this.createRefreshToken(
      user.id,
      false,
      tokenRecord.userAgent || undefined,
      tokenRecord.ipAddress || undefined,
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshTokenValue: string, userId: string, userAgent?: string, ipAddress?: string) {
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

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      const resetToken = uuidv4();
      const resetTokenHash = await bcrypt.hash(resetToken, 10);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: resetTokenHash,
          resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // TODO: Send email with resetToken (not the hash)
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }

    // Always return the same message regardless
    return { message: 'If this email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Find users with non-expired reset tokens
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
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: matchedUser.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    return { message: 'Password reset successful' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.prisma.auditLog.create({
      data: { userId, action: 'PASSWORD_CHANGED' },
    });

    return { message: 'Password changed successfully' };
  }

  async getMe(userId: string) {
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

  async getSessions(userId: string) {
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

  async revokeSession(sessionId: string, userId: string) {
    const token = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });

    if (!token) {
      throw new BadRequestException('Session not found');
    }

    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    return { message: 'Session revoked' };
  }

  // ─── Private Helpers ──────────────────────────────────────────

  private generateAccessToken(user: { id: string; email: string; role: string; departmentId: string | null }) {
    return this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    });
  }

  private async createRefreshToken(
    userId: string,
    rememberMe: boolean,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const expiresIn = rememberMe ? '30d' : (this.config.get<string>('jwt.refreshExpiresIn') || '7d');
    const expiresMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    const tokenId = uuidv4();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signOptions: any = {
      secret: this.config.get<string>('jwt.refreshSecret') || 'fallback-refresh',
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
}
