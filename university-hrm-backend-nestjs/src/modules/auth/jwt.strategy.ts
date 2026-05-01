import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  departmentId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (config.get<string>('jwt.secret') || 'fallback-secret') as string,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        employeeId: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        departmentId: true,
        status: true,
        profilePhoto: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    return {
      sub: user.id,
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      departmentId: user.departmentId,
      profilePhoto: user.profilePhoto,
    };
  }
}
