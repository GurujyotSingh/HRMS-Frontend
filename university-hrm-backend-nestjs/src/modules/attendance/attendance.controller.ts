import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseInterceptors(AuditLogInterceptor)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get()
  @ApiOperation({ summary: 'List attendance records (role-scoped)' })
  findAll(@Query() query: Record<string, string>, @CurrentUser() user: Record<string, unknown>) {
    return this.attendanceService.findAll(query, user as never);
  }

  @Get('calendar/:employeeId')
  @ApiOperation({ summary: 'Get attendance calendar for month' })
  getCalendar(@Param('employeeId') id: string, @Query('month') month: string, @Query('year') year: string) {
    return this.attendanceService.getCalendar(id, parseInt(month, 10), parseInt(year, 10));
  }

  @Get('summary/:employeeId')
  @ApiOperation({ summary: 'Get attendance summary for month' })
  getSummary(@Param('employeeId') id: string, @Query('month') month: string, @Query('year') year: string) {
    return this.attendanceService.getSummary(id, parseInt(month, 10), parseInt(year, 10));
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('attendance:manage')
  @ApiOperation({ summary: 'Bulk create/update attendance' })
  bulkUpsert(@Body() body: { date: string; records: Array<Record<string, unknown>> }) {
    return this.attendanceService.bulkUpsert(body.date, body.records as never);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('attendance:manage')
  @Audit('ATTENDANCE_CORRECTED')
  @ApiOperation({ summary: 'Correct attendance record' })
  correct(@Param('id') id: string, @Body() body: Record<string, unknown>, @CurrentUser('sub') userId: string) {
    return this.attendanceService.correct(id, body as never, userId);
  }
}
