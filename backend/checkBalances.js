const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const lb = await prisma.leaveBalance.findFirst({
    include: { leaveType: true }
  });
  console.log(JSON.stringify(lb, null, 2));
  await prisma.$disconnect();
})();
