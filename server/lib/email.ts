import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html }: { to: string, subject: string, html: string }) => {
  const { data, error } = await resend.emails.send({
    from: 'AI Website Builder <onboarding@resend.dev>',
    to,
    subject,
    html,
  });

  if (error) {
    console.error('Error sending email:', error);
    throw error;
  }

  return data;
};
