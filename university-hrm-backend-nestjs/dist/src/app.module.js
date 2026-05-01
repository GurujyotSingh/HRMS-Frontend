"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const departments_module_1 = require("./modules/departments/departments.module");
const leave_module_1 = require("./modules/leave/leave.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const payroll_module_1 = require("./modules/payroll/payroll.module");
const onboarding_module_1 = require("./modules/onboarding/onboarding.module");
const recruitment_module_1 = require("./modules/recruitment/recruitment.module");
const announcements_module_1 = require("./modules/announcements/announcements.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const documents_module_1 = require("./modules/documents/documents.module");
const holidays_module_1 = require("./modules/holidays/holidays.module");
const settings_module_1 = require("./modules/settings/settings.module");
const reports_module_1 = require("./modules/reports/reports.module");
const audit_module_1 = require("./modules/audit/audit.module");
const search_module_1 = require("./modules/search/search.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const ai_module_1 = require("./modules/ai/ai.module");
const performance_module_1 = require("./modules/performance/performance.module");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const configuration_1 = __importDefault(require("./config/configuration"));
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
            }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            departments_module_1.DepartmentsModule,
            leave_module_1.LeaveModule,
            attendance_module_1.AttendanceModule,
            payroll_module_1.PayrollModule,
            onboarding_module_1.OnboardingModule,
            recruitment_module_1.RecruitmentModule,
            announcements_module_1.AnnouncementsModule,
            notifications_module_1.NotificationsModule,
            documents_module_1.DocumentsModule,
            holidays_module_1.HolidaysModule,
            settings_module_1.SettingsModule,
            reports_module_1.ReportsModule,
            audit_module_1.AuditModule,
            search_module_1.SearchModule,
            dashboard_module_1.DashboardModule,
            ai_module_1.AiModule,
            performance_module_1.PerformanceModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map