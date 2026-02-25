import { commentRepository } from '@/repositories/comment.repository';
import { sanitizeInput } from '@/lib/validators';
import { notificationService } from './notification.service';
import { workorderRepository } from '@/repositories/workorder.repository';
import type { AuthorType } from '@prisma/client';

export const commentService = {
  async addClientComment(workOrderId: string, content: string, clientName: string) {
    const sanitized = sanitizeInput(content);

    const comment = await commentRepository.create({
      workOrderId,
      authorType: 'CLIENT' as AuthorType,
      authorName: clientName,
      content: sanitized,
      isInternal: false,
    });

    const order = await workorderRepository.findById(workOrderId);
    if (order) {
      notificationService.onNewComment({
        workOrderId,
        workorderNumber: order.workorderNumber,
        authorType: 'CLIENT',
        content: sanitized,
      });
    }

    return comment;
  },

  async addStaffComment(
    workOrderId: string,
    staffId: string,
    staffName: string,
    content: string,
    isInternal: boolean
  ) {
    const sanitized = sanitizeInput(content);

    const comment = await commentRepository.create({
      workOrderId,
      authorType: 'STAFF' as AuthorType,
      authorId: staffId,
      authorName: staffName,
      content: sanitized,
      isInternal,
    });

    if (!isInternal) {
      const order = await workorderRepository.findById(workOrderId);
      if (order) {
        notificationService.onNewComment({
          workOrderId,
          workorderNumber: order.workorderNumber,
          authorType: 'STAFF',
          content: sanitized,
        });
      }
    }

    return comment;
  },

  async getComments(workOrderId: string, includeInternal: boolean) {
    return commentRepository.findByWorkOrderId(workOrderId, includeInternal);
  },
};
