import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecruitmentService } from './recruitment.service';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Recruitment')
@ApiBearerAuth()
@Controller('recruitment')
@UseInterceptors(AuditLogInterceptor)
export class RecruitmentController {
  constructor(private recruitmentService: RecruitmentService) {}

  @Get('jobs') @ApiOperation({ summary: 'List jobs' })
  findAllJobs(@Query() q: Record<string, string>) { return this.recruitmentService.findAllJobs(q); }

  @Get('jobs/:id') @ApiOperation({ summary: 'Get job' })
  findOneJob(@Param('id') id: string) { return this.recruitmentService.findOneJob(id); }

  @Post('jobs') @UseGuards(PermissionsGuard) @RequirePermission('recruitment:manage') @Audit('JOB_POSTED')
  @ApiOperation({ summary: 'Create job' })
  createJob(@Body() body: Record<string, unknown>) { return this.recruitmentService.createJob(body); }

  @Patch('jobs/:id') @UseGuards(PermissionsGuard) @RequirePermission('recruitment:manage')
  @ApiOperation({ summary: 'Update job' })
  updateJob(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.recruitmentService.updateJob(id, body); }

  @Delete('jobs/:id') @UseGuards(PermissionsGuard) @RequirePermission('recruitment:manage')
  @ApiOperation({ summary: 'Delete job' })
  deleteJob(@Param('id') id: string) { return this.recruitmentService.deleteJob(id); }

  @Get('jobs/:jobId/applicants') @ApiOperation({ summary: 'List applicants for job' })
  getApplicants(@Param('jobId') jobId: string, @Query() q: Record<string, string>) { return this.recruitmentService.getApplicants(jobId, q); }

  @Post('jobs/:jobId/applicants') @UseGuards(PermissionsGuard) @RequirePermission('recruitment:manage', 'recruitment:assist')
  @ApiOperation({ summary: 'Add applicant' })
  addApplicant(@Param('jobId') jobId: string, @Body() body: Record<string, unknown>) { return this.recruitmentService.addApplicant(jobId, body); }

  @Patch('applicants/:id') @UseGuards(PermissionsGuard) @RequirePermission('recruitment:manage', 'recruitment:assist') @Audit('APPLICANT_STATUS_CHANGED')
  @ApiOperation({ summary: 'Update applicant' })
  updateApplicant(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.recruitmentService.updateApplicant(id, body); }

  @Post('applicants/:id/convert') @UseGuards(PermissionsGuard) @RequirePermission('recruitment:manage')
  @ApiOperation({ summary: 'Convert applicant to employee' })
  convert(@Param('id') id: string) { return this.recruitmentService.convertToEmployee(id); }
}
