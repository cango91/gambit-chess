import crypto from 'crypto';
import { RedisService } from './redis.service';

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const OTP_KEY_PREFIX = 'otp:';

// Generates a cryptographically secure random OTP
function generateOtp(length: number): string {
  // Use crypto for better randomness than Math.random
  // Generate bytes, convert to hex, take required digits, ensure padding if needed
  const buffer = crypto.randomBytes(Math.ceil(length / 2));
  let otp = parseInt(buffer.toString('hex'), 16).toString().padStart(length, '0');
  return otp.slice(0, length); // Ensure exact length
}

export const OtpService = {
  async generateAndStoreOtp(identifier: string): Promise<string> {
    const otp = generateOtp(OTP_LENGTH);
    const key = `${OTP_KEY_PREFIX}${identifier}`; // e.g., otp:user_id_123 or otp:user@example.com
    try {
      await RedisService.setWithTTL(key, otp, OTP_TTL_SECONDS);
      console.log(`Generated and stored OTP ${otp} for ${identifier}`); // Log for debugging
      return otp;
    } catch (error) {
      console.error(`Failed to store OTP for ${identifier}:`, error);
      throw new Error('Failed to generate verification code.');
    }
  },

  async verifyOtp(identifier: string, providedOtp: string): Promise<boolean> {
    const key = `${OTP_KEY_PREFIX}${identifier}`;
    try {
      const storedOtp = await RedisService.get(key);
      if (!storedOtp) {
        console.log(`No OTP found for ${identifier}`);
        return false; // No OTP found or expired
      }

      if (storedOtp === providedOtp) {
        // Optional: Delete OTP immediately after successful verification
        // await RedisService.del(key);
        return true;
      } else {
        console.log(`Invalid OTP provided for ${identifier}. Expected ${storedOtp}, got ${providedOtp}`);
        return false;
      }
    } catch (error) {
      console.error(`Error verifying OTP for ${identifier}:`, error);
      return false; // Treat errors as verification failure
    }
  },

  async deleteOtp(identifier: string): Promise<boolean> {
    const key = `${OTP_KEY_PREFIX}${identifier}`;
    try {
      return await RedisService.del(key);
    } catch (error) {
      console.error(`Error deleting OTP for ${identifier}:`, error);
      return false;
    }
  }
}; 