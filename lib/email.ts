import { Resend } from 'resend';
import { RegistrationEmail } from '@/components/emails/RegistrationEmail';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

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

    const { data, error } = await resend.emails.send({
      from: 'Bal Pradarshani <noreply@balpradarshani.com>', // Update this with verified domain if needed
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
      console.error('Resend email error:', error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Exception sending email:', err);
    return { error: err.message };
  }
}
