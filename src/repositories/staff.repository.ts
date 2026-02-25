import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

  async findAllIncludeInactive() {
    return prisma.staffUser.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: Prisma.StaffUserCreateInput) {
    return prisma.staffUser.create({ data });
  },

  async update(id: string, data: Prisma.StaffUserUpdateInput) {
    return prisma.staffUser.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.staffUser.delete({ where: { id } });
  },
};
