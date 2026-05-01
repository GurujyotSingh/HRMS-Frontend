"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmployeeId = generateEmployeeId;
async function generateEmployeeId(prisma) {
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
//# sourceMappingURL=employee-id.util.js.map