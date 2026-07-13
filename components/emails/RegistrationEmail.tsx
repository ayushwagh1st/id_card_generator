import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
  Font,
} from '@react-email/components';

interface RegistrationEmailProps {
  loginId: string;
  loginPass: string;
  websiteUrl: string;
  role: string;
  name: string;
}

export const RegistrationEmail = ({
  loginId,
  loginPass,
  websiteUrl,
  role,
  name,
}: RegistrationEmailProps) => {
  const portalUrl = websiteUrl || 'https://keidportal.qzz.io/';
  const supportUrl = `${portalUrl.replace(/\/$/, '')}/support`;

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          fontWeight={400}
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          fontWeight={600}
        />
      </Head>
      <Preview>Your account has been created successfully. Use the details below to sign in.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            {/* Header */}
            <Section style={header}>
              <Text style={brandName}>Bal Pradarshani</Text>
              <Text style={brandTagline}>Official Event Management Portal</Text>
            </Section>

            {/* Body Content */}
            <Section style={content}>
              <Text style={greeting}>Hello {name},</Text>

              <Text style={paragraph}>Welcome to <strong>Bal Pradarshani</strong>!</Text>

              <Text style={paragraph}>
                Your account has been successfully created by the organizing committee.
              </Text>

              <Text style={paragraph}>
                You can now access the event portal using login details below.
              </Text>

              <Hr style={divider} />

              {/* Credentials */}
              <Text style={label}>Portal</Text>
              <Link href={portalUrl} style={linkStyle}>{portalUrl}</Link>

              <Text style={label}>Login Email</Text>
              <Text style={value}>{loginId}</Text>

              <Text style={label}>Temporary Password</Text>
              <Text style={value}>{loginPass}</Text>

              <Hr style={divider} />

              {/* Support Section */}
              <Text style={supportHeading}>Need assistance?</Text>

              <Text style={supportLabel}>Support:</Text>
              <Link href={supportUrl} style={linkStyle}>{supportUrl}</Link>

              <Text style={supportLabel}>Website:</Text>
              <Link href={portalUrl} style={linkStyle}>{portalUrl}</Link>


              {/* Warning */}
              <Text style={warningText}>
                If you were not expecting this email, please contact the organizing committee immediately.
              </Text>

              {/* Sign-off */}
              <Text style={signOff}>
                Thank you,
              </Text>
              <Text style={signOffName}>
                Bal Pradarshani Organizing Committee
              </Text>

              <Hr style={divider} />

              <Text style={footer}>
                This is an Automated email regarding your Bal Pradarshani account.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default RegistrationEmail;

/* Clean Professional Styles */

const main = {
  backgroundColor: '#f4f4f5',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  padding: '40px 0',
};

const container = {
  margin: '0 auto',
  padding: '0 16px',
  maxWidth: '580px',
};

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden' as const,
};

const header = {
  backgroundColor: '#1a1a2e',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const brandName = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 4px',
  letterSpacing: '0.02em',
};

const brandTagline = {
  color: 'rgba(255,255,255,0.65)',
  fontSize: '13px',
  fontWeight: '400',
  margin: '0',
  letterSpacing: '0.03em',
};

const content = {
  padding: '36px 40px 32px',
};

const greeting = {
  fontSize: '16px',
  color: '#1a1a2e',
  margin: '0 0 20px',
  lineHeight: '24px',
};

const paragraph = {
  fontSize: '15px',
  color: '#3f3f46',
  lineHeight: '24px',
  margin: '0 0 12px',
};

const divider = {
  borderColor: '#e4e4e7',
  borderTopWidth: '1px',
  margin: '28px 0',
};

const label = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#71717a',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 4px',
};

const value = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#1a1a2e',
  margin: '0 0 20px',
};

const linkStyle = {
  display: 'inline-block' as const,
  fontSize: '15px',
  color: '#2563eb',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  margin: '0 0 20px',
};

const supportHeading = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#1a1a2e',
  margin: '0 0 16px',
};

const supportLabel = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#71717a',
  margin: '0 0 2px',
};

const warningText = {
  fontSize: '14px',
  color: '#a1a1aa',
  fontStyle: 'italic' as const,
  margin: '28px 0 24px',
  lineHeight: '22px',
};

const signOff = {
  fontSize: '15px',
  color: '#3f3f46',
  margin: '0 0 4px',
};

const signOffName = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#1a1a2e',
  margin: '0',
};

const footer = {
  fontSize: '12px',
  color: '#a1a1aa',
  textAlign: 'center' as const,
  margin: '0',
  lineHeight: '18px',
};
