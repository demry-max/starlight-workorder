import { prisma } from '@/lib/prisma';
import { AuthorType } from '@prisma/client';

export const commentRepository = {
  async findByWorkOrderId(workOrderId: string, includeInternal: boolean = false) {
    return prisma.comment.findMany({
      where: {
        workOrderId,
        ...(includeInternal ? {} : { isInternal: false }),
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  async create(data: {
    workOrderId: string;
    authorType: AuthorType;
    authorId?: string | null;
    authorName?: string | null;
    content: string;
    isInternal?: boolean;
  }) {
    return prisma.comment.create({ data });
  },
};
