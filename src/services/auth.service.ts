import bcrypt from 'bcryptjs';
import { workorderRepository } from '@/repositories/workorder.repository';
import { staffRepository } from '@/repositories/staff.repository';
import { signClientToken, signAdminToken, signRefreshToken } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter';

interface LoginResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  error?: string;
  locked?: boolean;
}

export const authService = {
  async clientLogin(workorderNumber: string, password: string): Promise<LoginResult> {
    // Rate limit by work order number
    const rateCheck = checkRateLimit(`client:${workorderNumber}`);
    if (!rateCheck.allowed) {
      return { success: false, error: 'rateLimited', locked: true };
    }

    const order = await workorderRepository.findByWorkorderNumber(workorderNumber);
    if (!order) {
      return { success: false, error: 'invalidCredentials' };
    }

    // Check if locked
    if (order.isLocked && order.lockedUntil && order.lockedUntil > new Date()) {
      return { success: false, error: 'locked', locked: true };
    }

    // If lock expired, reset
    if (order.isLocked && order.lockedUntil && order.lockedUntil <= new Date()) {
      await workorderRepository.resetFailedAttempts(order.id);
    }

    const valid = await bcrypt.compare(password, order.passwordHash);
    if (!valid) {
      await workorderRepository.incrementFailedAttempts(order.id);
      return { success: false, error: 'invalidCredentials' };
    }

    // Reset on successful login
    await workorderRepository.resetFailedAttempts(order.id);
    resetRateLimit(`client:${workorderNumber}`);

    const token = signClientToken({
      workOrderId: order.id,
      workorderNumber: order.workorderNumber,
    });

    const refreshToken = signRefreshToken({ id: order.id, type: 'client' });

    return { success: true, token, refreshToken };
  },

  async adminLogin(email: string, password: string): Promise<LoginResult> {
    // Rate limit by email
    const rateCheck = checkRateLimit(`admin:${email}`);
    if (!rateCheck.allowed) {
      return { success: false, error: 'rateLimited' };
    }

    const staff = await staffRepository.findByEmail(email);
    if (!staff || !staff.isActive) {
      return { success: false, error: 'invalidCredentials' };
    }

    const valid = await bcrypt.compare(password, staff.passwordHash);
    if (!valid) {
      return { success: false, error: 'invalidCredentials' };
    }

    resetRateLimit(`admin:${email}`);

    const token = signAdminToken({
      staffId: staff.id,
      email: staff.email,
      role: staff.role,
    });

    const refreshToken = signRefreshToken({ id: staff.id, type: 'admin' });

    return { success: true, token, refreshToken };
  },
};
