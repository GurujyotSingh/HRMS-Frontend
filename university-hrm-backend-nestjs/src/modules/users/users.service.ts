import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto/user.dto';
import { SystemRole, EmployeeStatus, Prisma } from '@prisma/client';
import { hashPassword } from '../../common/utils/password.util';
import { generateEmployeeId } from '../../common/utils/employee-id.util';
import { paginate, paginationArgs } from '../../common/utils/pagination.util';

// Fields never returned in API responses
const USER_SELECT: Prisma.UserSelect = {
  id: true, employeeId: true, firstName: true, lastName: true,
  email: true, workEmail: true, phone: true, personalEmail: true,
  dateOfBirth: true, gender: true, nationality: true, profilePhoto: true,
  bio: true, skills: true, role: true, designation: true,
  departmentId: true, department: { select: { id: true, name: true, code: true } },
  employmentType: true, salary: true, joinDate: true, exitDate: true,
  status: true, street: true, city: true, state: true, country: true,
  pincode: true, emergencyName: true, emergencyRelation: true,
  emergencyPhone: true, emergencyEmail: true, reportingManagerId: true,
  reportingManager: { select: { id: true, firstName: true, lastName: true } },
  createdAt: true, updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUsersDto, currentUser: { role: SystemRole; departmentId: string | null }) {
    const where: Prisma.UserWhereInput = {};

    // Role-based scoping
    if (currentUser.role === 'DIRECTOR') {
      where.departmentId = currentUser.departmentId;
    } else if (currentUser.role === 'FACULTY' || currentUser.role === 'STAFF') {
      throw new ForbiddenException('Not authorized to view employee list');
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employeeId: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.status) where.status = query.status as EmployeeStatus;
    if (query.employmentType) where.employmentType = query.employmentType as Prisma.EnumEmploymentTypeFilter['equals'];
    if (query.role) where.role = query.role as SystemRole;

    const { skip, take } = paginationArgs(query);
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (query.sortBy) {
      (orderBy as Record<string, string>)[query.sortBy] = query.sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, select: USER_SELECT, skip, take, orderBy }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(data, total, query.page || 1, query.limit || 20);
  }

  async findOne(id: string, currentUser: { role: SystemRole; departmentId: string | null; sub: string }) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException('User not found');

    // Ownership/scope check
    if (currentUser.role === 'FACULTY' || currentUser.role === 'STAFF') {
      if (id !== currentUser.sub) throw new ForbiddenException('You can only view your own profile');
    }
    if (currentUser.role === 'DIRECTOR' && user.departmentId !== currentUser.departmentId) {
      throw new ForbiddenException('User is not in your department');
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const employeeId = await generateEmployeeId(this.prisma);
    const passwordHash = await hashPassword('Welcome@123');

    const user = await this.prisma.user.create({
      data: {
        employeeId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        workEmail: dto.workEmail,
        passwordHash,
        phone: dto.phone,
        personalEmail: dto.personalEmail,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        nationality: dto.nationality,
        role: dto.role || 'STAFF',
        designation: dto.designation,
        departmentId: dto.departmentId,
        employmentType: dto.employmentType || 'FULL_TIME',
        salary: dto.salary,
        joinDate: dto.joinDate ? new Date(dto.joinDate) : new Date(),
        street: dto.street,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        pincode: dto.pincode,
        emergencyName: dto.emergencyName,
        emergencyRelation: dto.emergencyRelation,
        emergencyPhone: dto.emergencyPhone,
        emergencyEmail: dto.emergencyEmail,
        reportingManagerId: dto.reportingManagerId,
        bio: dto.bio,
        skills: dto.skills || [],
      },
      select: USER_SELECT,
    });

    // Create leave balance for current year
    const year = new Date().getFullYear();
    await this.prisma.leaveBalance.create({
      data: { employeeId: user.id, year },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, currentUser: { role: SystemRole; departmentId: string | null; sub: string }) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    // Build allowed fields based on role
    let allowedData: Prisma.UserUpdateInput = {};

    if (currentUser.role === 'SUPER_ADMIN') {
      // Can update everything
      allowedData = { ...dto } as Prisma.UserUpdateInput;
      if (dto.dateOfBirth) allowedData.dateOfBirth = new Date(dto.dateOfBirth);
      if (dto.joinDate) allowedData.joinDate = new Date(dto.joinDate);
    } else if (currentUser.role === 'HR_MANAGER') {
      const { role, ...rest } = dto;
      allowedData = { ...rest } as Prisma.UserUpdateInput;
      if (dto.dateOfBirth) allowedData.dateOfBirth = new Date(dto.dateOfBirth);
      if (dto.joinDate) allowedData.joinDate = new Date(dto.joinDate);
    } else if (currentUser.role === 'HR_STAFF') {
      allowedData = {
        firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone,
        street: dto.street, city: dto.city, state: dto.state,
        country: dto.country, pincode: dto.pincode,
        emergencyName: dto.emergencyName, emergencyRelation: dto.emergencyRelation,
        emergencyPhone: dto.emergencyPhone, emergencyEmail: dto.emergencyEmail,
      };
    } else if (currentUser.role === 'DIRECTOR') {
      if (existing.departmentId !== currentUser.departmentId) {
        throw new ForbiddenException('User is not in your department');
      }
      allowedData = {
        firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone,
        street: dto.street, city: dto.city, state: dto.state,
        country: dto.country, pincode: dto.pincode,
      };
    } else {
      // FACULTY/STAFF — own profile only
      if (id !== currentUser.sub) throw new ForbiddenException('You can only edit your own profile');
      allowedData = {
        firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone,
        personalEmail: dto.personalEmail, bio: dto.bio, skills: dto.skills,
        street: dto.street, city: dto.city, state: dto.state,
        country: dto.country, pincode: dto.pincode,
        emergencyName: dto.emergencyName, emergencyRelation: dto.emergencyRelation,
        emergencyPhone: dto.emergencyPhone, emergencyEmail: dto.emergencyEmail,
      };
    }

    // Remove undefined values
    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(allowedData)) {
      if (value !== undefined) cleanData[key] = value;
    }

    return this.prisma.user.update({
      where: { id },
      data: cleanData,
      select: USER_SELECT,
    });
  }

  async changeRole(id: string, role: SystemRole) {
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: USER_SELECT,
    });
  }

  async changeStatus(id: string, status: EmployeeStatus, reason?: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        status,
        ...(status === 'INACTIVE' && { exitDate: new Date() }),
      },
      select: USER_SELECT,
    });
  }

  async getStats(employeeId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: employeeId },
      select: { joinDate: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const tenure = user.joinDate
      ? Math.floor((now.getTime() - user.joinDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // This month attendance
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [presentDays, totalDays] = await Promise.all([
      this.prisma.attendance.count({
        where: { employeeId, date: { gte: monthStart }, status: 'PRESENT' },
      }),
      this.prisma.attendance.count({
        where: { employeeId, date: { gte: monthStart }, status: { not: 'WEEKEND' } },
      }),
    ]);
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Leave balance
    const leaveBalance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_year: { employeeId, year: now.getFullYear() } },
    });

    return { tenure, attendanceRate, leaveBalance };
  }

  async generateNextEmployeeId() {
    return { employeeId: await generateEmployeeId(this.prisma) };
  }
}
