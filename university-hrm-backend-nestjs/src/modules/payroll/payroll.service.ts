import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemRole, Prisma, LeaveStatus, AttendanceStatus } from '@prisma/client';
import { paginate } from '../../common/utils/pagination.util';

// ─── Salary Structure ────────────────────────────────────────────────────────

export interface SalaryStructureData {
  basicSalary: number;
  hra?: number;
  ta?: number;         // Travel Allowance
  da?: number;         // Dearness Allowance
  otherAllowances?: number;
  pfDeduction?: number;
  professionalTax?: number;
  tdsRate?: number;    // percentage (e.g. 10 = 10%)
  workingDaysPerMonth?: number;
}

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  // ── Salary Structure CRUD ─────────────────────────────────────────────

  async setSalaryStructure(employeeId: string, data: SalaryStructureData) {
    return this.prisma.salaryStructure.upsert({
      where: { employeeId },
      create: {
        employeeId,
        basicSalary: data.basicSalary,
        hra: data.hra ?? 0,
        ta: data.ta ?? 0,
        da: data.da ?? 0,
        otherAllowances: data.otherAllowances ?? 0,
        pfDeduction: data.pfDeduction ?? 0,
        professionalTax: data.professionalTax ?? 0,
        tdsRate: data.tdsRate ?? 0,
        workingDaysPerMonth: data.workingDaysPerMonth ?? 26,
      },
      update: {
        basicSalary: data.basicSalary,
        hra: data.hra ?? 0,
        ta: data.ta ?? 0,
        da: data.da ?? 0,
        otherAllowances: data.otherAllowances ?? 0,
        pfDeduction: data.pfDeduction ?? 0,
        professionalTax: data.professionalTax ?? 0,
        tdsRate: data.tdsRate ?? 0,
        workingDaysPerMonth: data.workingDaysPerMonth ?? 26,
        updatedAt: new Date(),
      },
    });
  }

  async getSalaryStructure(employeeId: string) {
    return this.prisma.salaryStructure.findUnique({ where: { employeeId } });
  }

  // ── Payslip queries ───────────────────────────────────────────────────

  async findAll(query: Record<string, unknown>, currentUser: { sub: string; role: SystemRole }) {
    const where: Prisma.PayslipWhereInput = {};

    // Non-HR employees only see own payslips (published only)
    if (currentUser.role === SystemRole.FACULTY || currentUser.role === SystemRole.STAFF) {
      where.employeeId = currentUser.sub;
      where.status = 'PUBLISHED';
    }

    if (query.employeeId) where.employeeId = query.employeeId as string;
    if (query.month) where.month = Number(query.month);
    if (query.year) where.year = Number(query.year);
    if (query.status) where.status = query.status as 'DRAFT' | 'PUBLISHED';
    if (query.departmentId) {
      where.employee = { departmentId: query.departmentId as string };
    }

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.payslip.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true, firstName: true, lastName: true, employeeId: true,
              designation: true, department: { select: { name: true } },
            },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payslip.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const payslip = await this.prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true, firstName: true, lastName: true, employeeId: true,
            designation: true, joinDate: true,
            department: { select: { name: true } },
            salaryStructure: true,
          },
        },
      },
    });
    if (!payslip) throw new NotFoundException('Payslip not found');
    return payslip;
  }

  // ── Payslip generation (matches old Python logic exactly) ─────────────

  async generateForEmployee(employeeId: string, month: number, year: number, notes?: string) {
    // Get salary structure
    const structure = await this.prisma.salaryStructure.findUnique({ where: { employeeId } });
    if (!structure) {
      throw new BadRequestException(`No salary structure for employee ${employeeId}. Set it first.`);
    }

    // Check if payslip already exists
    const existing = await this.prisma.payslip.findUnique({
      where: { employeeId_month_year: { employeeId, month, year } },
    });
    if (existing) {
      throw new BadRequestException(`Payslip for ${month}/${year} already exists`);
    }

    // Get attendance stats
    const { daysPresent, daysAbsent, daysOnLeave } = await this.getAttendanceStats(
      employeeId, month, year, structure.workingDaysPerMonth,
    );

    // Calculate payslip
    const calc = this.calculatePayslip(structure, daysPresent, daysAbsent, daysOnLeave);

    return this.prisma.payslip.create({
      data: {
        employeeId,
        month,
        year,
        notes: notes || null,
        ...calc,
        status: 'DRAFT',
        generatedAt: new Date(),
      },
      include: { employee: { select: { firstName: true, lastName: true, employeeId: true } } },
    });
  }

  async generate(data: Record<string, unknown>) {
    const month = Number(data.month);
    const year = Number(data.year);
    const departmentId = data.departmentId as string | undefined;
    const employeeId = data.employeeId as string | undefined;

    if (employeeId) {
      return this.generateForEmployee(employeeId, month, year, data.notes as string);
    }

    // Bulk generation
    const where: Prisma.UserWhereInput = { status: 'ACTIVE' };
    if (departmentId) where.departmentId = departmentId;

    const employees = await this.prisma.user.findMany({
      where,
      include: { salaryStructure: true },
    });

    const results: { success: number; failed: number; errors: string[] } = { success: 0, failed: 0, errors: [] };

    for (const emp of employees) {
      if (!emp.salaryStructure) {
        results.failed++;
        results.errors.push(`${emp.firstName} ${emp.lastName}: No salary structure`);
        continue;
      }

      const { daysPresent, daysAbsent, daysOnLeave } = await this.getAttendanceStats(
        emp.id, month, year, emp.salaryStructure.workingDaysPerMonth,
      );

      const calc = this.calculatePayslip(emp.salaryStructure, daysPresent, daysAbsent, daysOnLeave);

      try {
        await this.prisma.payslip.upsert({
          where: { employeeId_month_year: { employeeId: emp.id, month, year } },
          create: { employeeId: emp.id, month, year, ...calc, status: 'DRAFT', generatedAt: new Date() },
          update: { ...calc, status: 'DRAFT', generatedAt: new Date() },
        });
        results.success++;
      } catch (e) {
        results.failed++;
        results.errors.push(`${emp.firstName}: ${(e as Error).message}`);
      }
    }

    return { ...results, month, year };
  }

  async publish(id: string) {
    const payslip = await this.prisma.payslip.findUnique({ where: { id } });
    if (!payslip) throw new NotFoundException('Payslip not found');
    return this.prisma.payslip.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });
  }

  async getSummary(month: number, year: number) {
    const payslips = await this.prisma.payslip.findMany({ where: { month, year } });
    const totalGross = payslips.reduce((s, p) => s + p.grossSalary, 0);
    const totalDeductions = payslips.reduce((s, p) => s + p.totalDeductions, 0);
    const totalNet = payslips.reduce((s, p) => s + p.netSalary, 0);
    return {
      month, year,
      totalEmployees: payslips.length,
      totalGross: Math.round(totalGross * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────

  private async getAttendanceStats(
    employeeId: string, month: number, year: number, workingDays: number,
  ): Promise<{ daysPresent: number; daysAbsent: number; daysOnLeave: number }> {
    // Count PRESENT records for this month
    const presentCount = await this.prisma.attendance.count({
      where: {
        employeeId,
        status: AttendanceStatus.PRESENT,
        date: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
    });

    // Count approved leaves in this month
    const approvedLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: LeaveStatus.APPROVED,
        fromDate: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      select: { fromDate: true, toDate: true, totalDays: true },
    });

    const daysOnLeave = approvedLeaves.reduce((s, l) => s + l.totalDays, 0);
    const daysPresent = presentCount;
    const daysAbsent = Math.max(workingDays - daysPresent - daysOnLeave, 0);

    return { daysPresent, daysAbsent, daysOnLeave };
  }

  /**
   * Mirrors the Python payroll_service._calculate_payslip logic exactly:
   * - Prorate all earnings by (present + on_leave) / working_days
   * - Absent deduction = (basic/working_days) × absent_days
   * - PF and professional tax are fixed amounts
   * - TDS = tdsRate% of gross
   */
  private calculatePayslip(
    structure: {
      basicSalary: number; hra: number; ta: number; da: number;
      otherAllowances: number; pfDeduction: number; professionalTax: number;
      tdsRate: number; workingDaysPerMonth: number;
    },
    daysPresent: number,
    daysAbsent: number,
    daysOnLeave: number,
  ) {
    const r2 = (v: number) => Math.round(v * 100) / 100;

    const workingDays = structure.workingDaysPerMonth;
    const perDayRate = structure.basicSalary / workingDays;
    const paidDays = daysPresent + daysOnLeave;
    const ratio = workingDays > 0 ? paidDays / workingDays : 0;

    const basic = r2(structure.basicSalary * ratio);
    const hra   = r2(structure.hra * ratio);
    const ta    = r2(structure.ta * ratio);
    const da    = r2(structure.da * ratio);
    const other = r2(structure.otherAllowances * ratio);
    const gross = r2(basic + hra + ta + da + other);

    const absentDeduction = r2(perDayRate * daysAbsent);
    const pf              = r2(structure.pfDeduction);
    const profTax         = r2(structure.professionalTax);
    const tds             = r2(gross * structure.tdsRate / 100);
    const totalDeductions = r2(absentDeduction + pf + profTax + tds);
    const netSalary       = r2(gross - totalDeductions);

    return {
      workingDays,
      daysPresent,
      daysAbsent,
      daysOnLeave,
      basicSalary: basic,
      hra,
      ta,
      da,
      otherAllowances: other,
      grossSalary: gross,
      absentDeduction,
      pfDeduction: pf,
      professionalTax: profTax,
      tdsDeduction: tds,
      totalDeductions,
      netSalary,
    };
  }
}
