import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangeRoleDto, ChangeStatusDto, QueryUsersDto } from './dto/user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { EmployeeStatus, SystemRole } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseInterceptors(AuditLogInterceptor)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (role-scoped)' })
  findAll(@Query() query: QueryUsersDto, @CurrentUser() user: Record<string, unknown>) {
    return this.usersService.findAll(query, user as { role: SystemRole; departmentId: string | null });
  }

  @Get('generate-employee-id')
  @UseGuards(PermissionsGuard)
  @RequirePermission('employees:create')
  @ApiOperation({ summary: 'Generate next employee ID' })
  generateEmployeeId() {
    return this.usersService.generateNextEmployeeId();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (role-scoped)' })
  findOne(@Param('id') id: string, @CurrentUser() user: Record<string, unknown>) {
    return this.usersService.findOne(id, user as { role: SystemRole; departmentId: string | null; sub: string });
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  getStats(@Param('id') id: string) {
    return this.usersService.getStats(id);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('employees:create')
  @Audit('EMPLOYEE_CREATED')
  @ApiOperation({ summary: 'Create a new employee' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Audit('EMPLOYEE_UPDATED')
  @ApiOperation({ summary: 'Update user (role-scoped field access)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: Record<string, unknown>) {
    return this.usersService.update(id, dto, user as { role: SystemRole; departmentId: string | null; sub: string });
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(SystemRole.SUPER_ADMIN)
  @Audit('ROLE_CHANGED')
  @ApiOperation({ summary: 'Change user role (SUPER_ADMIN only)' })
  changeRole(@Param('id') id: string, @Body() dto: ChangeRoleDto) {
    return this.usersService.changeRole(id, dto.role);
  }

  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @RequirePermission('employees:deactivate')
  @Audit('EMPLOYEE_DEACTIVATED')
  @ApiOperation({ summary: 'Change user status' })
  changeStatus(@Param('id') id: string, @Body() dto: ChangeStatusDto) {
    return this.usersService.changeStatus(id, dto.status as EmployeeStatus, dto.reason);
  }
}
