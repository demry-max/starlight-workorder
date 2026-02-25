import { prisma } from '@/lib/prisma';

export const staffRepository = {
  async findByEmail(email: string) {
    return prisma.staffUser.findUnique({ where: { email } });
  },

  async findById(id: string) {
    return prisma.staffUser.findUnique({ where: { id } });
  },

  async findAll() {
    return prisma.staffUser.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
  },
};
