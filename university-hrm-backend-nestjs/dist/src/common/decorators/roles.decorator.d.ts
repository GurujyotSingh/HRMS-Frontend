import { SystemRole } from '@prisma/client';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: SystemRole[]) => import("@nestjs/common").CustomDecorator<string>;
