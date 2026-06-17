import { Resend } from 'resend';
import { RegistrationEmail } from '@/components/emails/RegistrationEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

// Helper for generic exponential backoff retries
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`Operation failed, retrying in ${delay}ms... (Attempt ${attempt + 1} of ${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable code in withRetry');
}

export async function sendRegistrationEmail({
  email,
  name,
  loginId,
  loginPass,
  role,
}: {
  email: string;
  name: string;
  loginId: string;
  loginPass: string;
  role: string;
}) {
  try {
    const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://keidportal.qzz.io/';
    
    // In local development without API key, just log it
    if (!process.env.RESEND_API_KEY) {
      console.log('RESEND_API_KEY is not set. Mocking email send to:', email);
      return { success: true, mocked: true };
    }

    // Wrapped inside withRetry for maximum reliability
    const result = await withRetry(async () => {
      const { data, error } = await resend.emails.send({
        from: 'Bal Pradarshani <onboarding@resend.dev>', // Resend requires this for unverified domains
        to: [email],
        subject: 'Welcome to Bal Pradarshani - Your Account Credentials',
        react: RegistrationEmail({
          loginId,
          loginPass,
          websiteUrl,
          role,
          name,
        }),
      });

      if (error) {
        // Throwing will trigger the retry mechanism
        throw new Error(error.message);
      }
      return data;
    }, 3, 1000); // 3 retries, starting with 1000ms delay

    return { success: true, data: result };
  } catch (err: any) {
    console.error('Exception sending email after retries:', err);
    return { error: err.message };
  }
}

import { ResetPasswordEmail } from '@/components/emails/ResetPasswordEmail';

export async function sendPasswordResetEmail({
  email,
  resetLink,
}: {
  email: string;
  resetLink: string;
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('RESEND_API_KEY is not set. Mocking password reset email to:', email);
      console.log('Link:', resetLink);
      return { success: true, mocked: true };
    }

    const result = await withRetry(async () => {
      const { data, error } = await resend.emails.send({
        from: 'Bal Pradarshani <onboarding@resend.dev>', // Update this with verified domain if needed
        to: [email],
        subject: 'Reset your password - Bal Pradarshani',
        react: ResetPasswordEmail({ resetLink }),
      });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    }, 3, 1000);

    return { success: true, data: result };
  } catch (err: any) {
    console.error('Exception sending password reset email:', err);
    return { error: err.message };
  }
}

