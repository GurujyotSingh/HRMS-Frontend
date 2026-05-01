import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SystemRole } from '@prisma/client';

@ApiTags('Performance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private readonly svc: PerformanceService) {}

  // ── Appraisal Cycles ──────────────────────────────────────────────────

  @Post('cycles')
  @Roles(SystemRole.HR_MANAGER, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'HR: create appraisal cycle' })
  createCycle(@Body() body: Record<string, unknown>) {
    return this.svc.createCycle(body);
  }

  @Get('cycles')
  @ApiOperation({ summary: 'List all appraisal cycles' })
  getCycles() {
    return this.svc.getAllCycles();
  }

  @Get('cycles/active')
  @ApiOperation({ summary: 'Get current active cycle' })
  getActiveCycle() {
    return this.svc.getActiveCycle();
  }

  @Patch('cycles/:id/close')
  @Roles(SystemRole.HR_MANAGER, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'HR: close an appraisal cycle' })
  closeCycle(@Param('id') id: string) {
    return this.svc.closeCycle(id);
  }

  // ── Employee: goals ───────────────────────────────────────────────────

  @Get('goals/my')
  @ApiOperation({ summary: 'Employee: view own goals' })
  myGoals(@CurrentUser() user: { sub: string }) {
    return this.svc.getMyGoals(user.sub);
  }

  @Post('goals')
  @ApiOperation({ summary: 'Employee: set goals for active cycle' })
  createGoal(@CurrentUser() user: { sub: string }, @Body() body: Record<string, unknown>) {
    return this.svc.createGoal(user.sub, body);
  }

  @Patch('goals/:id/submit')
  @ApiOperation({ summary: 'Employee: submit goals for Director review' })
  submitGoal(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.svc.submitGoal(id, user.sub);
  }

  @Patch('goals/:id/self-review')
  @ApiOperation({ summary: 'Employee: submit self-rating' })
  selfReview(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body() body: Record<string, unknown>,
  ) {
    return this.svc.selfReview(id, user.sub, body);
  }

  // ── Director: review ─────────────────────────────────────────────────

  @Get('goals/director/pending')
  @Roles(SystemRole.DIRECTOR)
  @ApiOperation({ summary: 'Director: view submitted goals in department' })
  directorPending(@CurrentUser() user: { sub: string; departmentId: string | null }) {
    return this.svc.getDirectorPendingGoals(user.departmentId!);
  }

  @Patch('goals/:id/director-review')
  @Roles(SystemRole.DIRECTOR)
  @ApiOperation({ summary: 'Director: rate and review a goal' })
  directorReview(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; departmentId: string | null },
    @Body() body: Record<string, unknown>,
  ) {
    return this.svc.directorReview(id, user.sub, user.departmentId!, body);
  }

  @Post('goals/assign')
  @Roles(SystemRole.DIRECTOR)
  @ApiOperation({ summary: 'Director: assign goal to an employee' })
  assignGoal(
    @CurrentUser() user: { sub: string; departmentId: string | null },
    @Body() body: Record<string, unknown>,
  ) {
    return this.svc.assignGoal(user.sub, user.departmentId!, body);
  }

  // ── HR: all goals + finalize ──────────────────────────────────────────

  @Get('goals')
  @Roles(SystemRole.HR_MANAGER, SystemRole.HR_STAFF, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'HR: view all goals' })
  getAllGoals(@Query('cycleId') cycleId?: string) {
    return this.svc.getAllGoals(cycleId);
  }

  @Patch('goals/:id/finalize')
  @Roles(SystemRole.HR_MANAGER, SystemRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'HR: set final rating' })
  hrFinalize(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body() body: Record<string, unknown>,
  ) {
    return this.svc.hrFinalize(id, user.sub, body);
  }
}
