import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, RecruitmentStatus, ApplicantStatus, EmploymentType } from '@prisma/client';
import { paginate } from '../../common/utils/pagination.util';
import { hashPassword } from '../../common/utils/password.util';
import { generateEmployeeId } from '../../common/utils/employee-id.util';

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  async findAllJobs(query: Record<string, unknown>) {
    const where: Prisma.RecruitmentJobWhereInput = {};
    if (query.status) where.status = query.status as RecruitmentStatus;
    if (query.departmentId) where.departmentId = query.departmentId as string;
    if (query.type) where.type = query.type as Prisma.EnumEmploymentTypeFilter['equals'];
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.recruitmentJob.findMany({
        where, include: { department: { select: { name: true } }, _count: { select: { applicants: true } } },
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
      }),
      this.prisma.recruitmentJob.count({ where }),
    ]);
    return paginate(data.map(j => ({ ...j, applicantCount: j._count.applicants, _count: undefined })), total, page, limit);
  }

  async findOneJob(id: string) {
    const job = await this.prisma.recruitmentJob.findUnique({
      where: { id },
      include: {
        department: { select: { name: true } },
        applicants: { orderBy: { appliedAt: 'desc' } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    // Group applicant counts by status
    const statusCounts: Record<string, number> = {};
    for (const a of job.applicants) { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; }
    return { ...job, statusCounts };
  }

  async createJob(data: Record<string, unknown>) {
    return this.prisma.recruitmentJob.create({
      data: {
        title: data.title as string,
        departmentId: data.departmentId as string,
        type: data.type as EmploymentType,
        description: data.description as string,
        requirements: (data.requirements as string[]) || [],
        closingDate: new Date(data.closingDate as string),
      },
    });
  }

  async updateJob(id: string, data: Record<string, unknown>) {
    const updateData: Record<string, unknown> = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.requirements) updateData.requirements = data.requirements;
    if (data.status) updateData.status = data.status;
    if (data.closingDate) updateData.closingDate = new Date(data.closingDate as string);
    return this.prisma.recruitmentJob.update({ where: { id }, data: updateData });
  }

  async deleteJob(id: string) { return this.prisma.recruitmentJob.delete({ where: { id } }); }

  async getApplicants(jobId: string, query: Record<string, unknown>) {
    const where: Prisma.RecruitmentApplicantWhereInput = { jobId };
    if (query.status) where.status = query.status as ApplicantStatus;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const [data, total] = await Promise.all([
      this.prisma.recruitmentApplicant.findMany({ where, orderBy: { appliedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.recruitmentApplicant.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async addApplicant(jobId: string, data: Record<string, unknown>) {
    return this.prisma.recruitmentApplicant.create({
      data: { jobId, name: data.name as string, email: data.email as string, phone: data.phone as string, resumeUrl: data.resumeUrl as string, notes: data.notes as string },
    });
  }

  async updateApplicant(id: string, data: Record<string, unknown>) {
    return this.prisma.recruitmentApplicant.update({ where: { id }, data: { status: data.status as ApplicantStatus, notes: data.notes as string } });
  }

  async convertToEmployee(applicantId: string) {
    const applicant = await this.prisma.recruitmentApplicant.findUnique({ where: { id: applicantId }, include: { job: true } });
    if (!applicant) throw new NotFoundException('Applicant not found');

    const empId = await generateEmployeeId(this.prisma);
    const passwordHash = await hashPassword('Welcome@123');
    const names = applicant.name.split(' ');

    const user = await this.prisma.user.create({
      data: {
        employeeId: empId, firstName: names[0] || applicant.name, lastName: names.slice(1).join(' ') || '',
        email: applicant.email, workEmail: applicant.email, passwordHash,
        phone: applicant.phone, departmentId: applicant.job.departmentId,
        employmentType: applicant.job.type, joinDate: new Date(),
      },
    });

    await this.prisma.recruitmentApplicant.update({ where: { id: applicantId }, data: { status: 'HIRED' } });
    await this.prisma.leaveBalance.create({ data: { employeeId: user.id, year: new Date().getFullYear() } });
    return user;
  }
}
