import { PrismaService } from '../../prisma/prisma.service';

/**
 * Generates sequential employee IDs in the format EMP-YYYY-XXXX
 * e.g. EMP-2026-0001, EMP-2026-0002
 */
export async function generateEmployeeId(prisma: PrismaService): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `EMP-${currentYear}-`;

  const lastUser = await prisma.user.findFirst({
    where: {
      employeeId: { startsWith: prefix },
    },
    orderBy: { employeeId: 'desc' },
    select: { employeeId: true },
  });

  let nextNumber = 1;
  if (lastUser) {
    const lastNumber = parseInt(lastUser.employeeId.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}
