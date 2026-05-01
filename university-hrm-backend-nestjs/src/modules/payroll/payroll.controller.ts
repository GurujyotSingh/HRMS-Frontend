import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { SystemRole } from '@prisma/client';

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller('payroll')
@UseGuards(RolesGuard)
@UseInterceptors(AuditLogInterceptor)
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  // ── Payslips ──────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List payslips (role-scoped)' })
  findAll(@Query() query: Record<string, string>, @CurrentUser() user: Record<string, unknown>) {
    return this.payrollService.findAll(query, user as never);
  }

  @Get('summary')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_STAFF, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get payroll summary for a month' })
  getSummary(@Query('month') month: string, @Query('year') year: string) {
    return this.payrollService.getSummary(Number(month), Number(year));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payslip by ID' })
  findOne(@Param('id') id: string) { return this.payrollService.findOne(id); }

  @Post('generate')
  @Roles(SystemRole.HR_MANAGER, SystemRole.SUPER_ADMIN)
  @Audit('PAYSLIP_GENERATED')
  @ApiOperation({ summary: 'Generate payslips for one employee or all' })
  generate(@Body() body: Record<string, unknown>) {
    return this.payrollService.generate(body);
  }

  @Patch(':id/publish')
  @Roles(SystemRole.HR_MANAGER, SystemRole.SUPER_ADMIN)
  @Audit('PAYSLIP_PUBLISHED')
  @ApiOperation({ summary: 'Publish (finalize) a payslip so employee can view it' })
  publish(@Param('id') id: string) { return this.payrollService.publish(id); }

  // ── Salary Structure ──────────────────────────────────────────────────

  @Get('salary-structure/:employeeId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_STAFF, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get salary structure for an employee' })
  getSalaryStructure(@Param('employeeId') employeeId: string) {
    return this.payrollService.getSalaryStructure(employeeId);
  }

  @Post('salary-structure/:employeeId')
  @Roles(SystemRole.HR_MANAGER, SystemRole.SUPER_ADMIN)
  @Audit('PAYSLIP_GENERATED')
  @ApiOperation({ summary: 'Set/update salary structure for an employee' })
  setSalaryStructure(@Param('employeeId') employeeId: string, @Body() body: Record<string, unknown>) {
    return this.payrollService.setSalaryStructure(employeeId, {
      basicSalary: Number(body.basicSalary),
      hra: Number(body.hra || 0),
      ta: Number(body.ta || 0),
      da: Number(body.da || 0),
      otherAllowances: Number(body.otherAllowances || 0),
      pfDeduction: Number(body.pfDeduction || 0),
      professionalTax: Number(body.professionalTax || 0),
      tdsRate: Number(body.tdsRate || 0),
      workingDaysPerMonth: Number(body.workingDaysPerMonth || 26),
    });
  }
}
