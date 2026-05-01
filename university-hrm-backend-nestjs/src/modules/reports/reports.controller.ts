import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@ApiTags('Reports') @ApiBearerAuth() @Controller('reports') @UseGuards(PermissionsGuard)
export class ReportsController {
  constructor(private svc: ReportsService) {}

  @Get('attendance') @RequirePermission('reports:view_all', 'reports:view_department')
  @ApiOperation({ summary: 'Attendance report' })
  attendance(@Query() q: Record<string, string>) { return this.svc.attendanceReport(q); }

  @Get('leave') @RequirePermission('reports:view_all', 'reports:view_department')
  @ApiOperation({ summary: 'Leave report' })
  leave(@Query() q: Record<string, string>) { return this.svc.leaveReport(q); }

  @Get('headcount') @RequirePermission('reports:view_all', 'reports:view_department')
  @ApiOperation({ summary: 'Headcount report' })
  headcount(@Query() q: Record<string, string>) { return this.svc.headcountReport(q); }

  @Get('payroll') @RequirePermission('payroll:view_all')
  @ApiOperation({ summary: 'Payroll report' })
  payroll(@Query() q: Record<string, string>) { return this.svc.payrollReport(q); }
}
