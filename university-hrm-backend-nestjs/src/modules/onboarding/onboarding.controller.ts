import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
@UseInterceptors(AuditLogInterceptor)
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Get() @ApiOperation({ summary: 'List onboarding records' })
  findAll(@Query() query: Record<string, string>) { return this.onboardingService.findAll(query); }

  @Get(':id') @ApiOperation({ summary: 'Get onboarding by ID' })
  findOne(@Param('id') id: string) { return this.onboardingService.findOne(id); }

  @Get('employee/:employeeId') @ApiOperation({ summary: 'Get onboarding by employee' })
  findByEmployee(@Param('employeeId') id: string) { return this.onboardingService.findByEmployee(id); }

  @Post() @UseGuards(PermissionsGuard) @RequirePermission('onboarding:manage') @Audit('ONBOARDING_CREATED')
  @ApiOperation({ summary: 'Create onboarding' })
  create(@Body() body: Record<string, unknown>) { return this.onboardingService.create(body as never); }

  @Post(':id/tasks') @UseGuards(PermissionsGuard) @RequirePermission('onboarding:manage', 'onboarding:assist')
  @ApiOperation({ summary: 'Add task to onboarding' })
  addTask(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.onboardingService.addTask(id, body as never); }

  @Patch('tasks/reorder') @UseGuards(PermissionsGuard) @RequirePermission('onboarding:manage')
  @ApiOperation({ summary: 'Reorder tasks' })
  reorderTasks(@Body() body: { taskIds: string[] }) { return this.onboardingService.reorderTasks(body.taskIds); }

  @Patch('tasks/:taskId') @Audit('ONBOARDING_TASK_UPDATED')
  @ApiOperation({ summary: 'Update onboarding task' })
  updateTask(@Param('taskId') id: string, @Body() body: Record<string, unknown>) { return this.onboardingService.updateTask(id, body); }

  @Delete('tasks/:taskId') @UseGuards(PermissionsGuard) @RequirePermission('onboarding:manage')
  @ApiOperation({ summary: 'Delete onboarding task' })
  deleteTask(@Param('taskId') id: string) { return this.onboardingService.deleteTask(id); }
}
