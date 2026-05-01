import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SystemRole } from '@prisma/client';

@ApiTags('Dashboard') @ApiBearerAuth() @Controller('dashboard')
export class DashboardController {
  constructor(private svc: DashboardService) {}

  @Get() @ApiOperation({ summary: 'Get dashboard based on role' })
  async getDashboard(@CurrentUser() user: { sub: string; role: SystemRole; departmentId: string | null }) {
    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'HR_MANAGER':
      case 'HR_STAFF':
        return this.svc.getAdminDashboard();
      case 'DIRECTOR':
        return this.svc.getDirectorDashboard(user.departmentId!);
      default:
        return this.svc.getEmployeeDashboard(user.sub);
    }
  }

  @Get('admin') @ApiOperation({ summary: 'Admin dashboard' })
  getAdmin() { return this.svc.getAdminDashboard(); }

  @Get('director') @ApiOperation({ summary: 'Director dashboard' })
  getDirector(@CurrentUser('departmentId') deptId: string) { return this.svc.getDirectorDashboard(deptId); }

  @Get('employee') @ApiOperation({ summary: 'Employee dashboard' })
  getEmployee(@CurrentUser('sub') userId: string) { return this.svc.getEmployeeDashboard(userId); }
}
