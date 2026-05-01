import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';

class ApplyLeaveDto {
  @ApiProperty({ enum: LeaveType }) @IsEnum(LeaveType) leaveType: LeaveType;
  @ApiProperty() @IsDateString() fromDate: string;
  @ApiProperty() @IsDateString() toDate: string;
  @ApiProperty() @IsString() reason: string;
  @ApiPropertyOptional() @IsOptional() @IsString() attachmentUrl?: string;
}

class ReviewLeaveDto {
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}

@ApiTags('Leave')
@ApiBearerAuth()
@Controller('leave')
@UseInterceptors(AuditLogInterceptor)
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Get()
  @ApiOperation({ summary: 'List leave requests (role-scoped)' })
  findAll(@Query() query: Record<string, string>, @CurrentUser() user: Record<string, unknown>) {
    return this.leaveService.findAll(query, user as never);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('leave:apply')
  @Audit('LEAVE_APPLIED')
  @ApiOperation({ summary: 'Apply for leave' })
  apply(@Body() dto: ApplyLeaveDto, @CurrentUser('sub') userId: string) {
    return this.leaveService.apply(userId, dto);
  }

  @Patch(':id/approve')
  @UseGuards(PermissionsGuard)
  @RequirePermission('leave:approve_all', 'leave:approve_department')
  @Audit('LEAVE_APPROVED')
  @ApiOperation({ summary: 'Approve leave request' })
  approve(@Param('id') id: string, @Body() dto: ReviewLeaveDto, @CurrentUser('sub') userId: string) {
    return this.leaveService.approve(id, userId, dto.remarks);
  }

  @Patch(':id/reject')
  @UseGuards(PermissionsGuard)
  @RequirePermission('leave:approve_all', 'leave:approve_department')
  @Audit('LEAVE_REJECTED')
  @ApiOperation({ summary: 'Reject leave request' })
  reject(@Param('id') id: string, @Body() dto: ReviewLeaveDto, @CurrentUser('sub') userId: string) {
    return this.leaveService.reject(id, userId, dto.remarks || '');
  }

  @Patch(':id/cancel')
  @Audit('LEAVE_CANCELLED')
  @ApiOperation({ summary: 'Cancel leave request' })
  cancel(@Param('id') id: string, @CurrentUser() user: Record<string, unknown>) {
    return this.leaveService.cancel(id, (user as Record<string, string>).sub, (user as Record<string, string>).role as never);
  }

  @Get('balance/:employeeId')
  @ApiOperation({ summary: 'Get leave balance for current year' })
  getBalance(@Param('employeeId') employeeId: string) {
    return this.leaveService.getBalance(employeeId);
  }

  @Get('balance/:employeeId/:year')
  @ApiOperation({ summary: 'Get leave balance for specific year' })
  getBalanceByYear(@Param('employeeId') employeeId: string, @Param('year') year: string) {
    return this.leaveService.getBalance(employeeId, parseInt(year, 10));
  }
}
