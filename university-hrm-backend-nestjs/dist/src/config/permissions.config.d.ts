import { SystemRole } from '@prisma/client';
export declare const ROLE_PERMISSIONS: Record<SystemRole, string[]>;
export declare function hasPermission(role: SystemRole, permission: string): boolean;
