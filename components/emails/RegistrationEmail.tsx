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
  Font
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
      <Preview>Your account has been created. Use the details below to sign in.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            <div style={headerDecor}>BAL PRADARSHANI</div>
            <Section style={innerContent}>
              
              <Text style={tagline}>Official Event Management Portal</Text>
              
              <Text style={text}>
                Hello {name},<br/><br/>
                Welcome to <strong>Bal Pradarshani!</strong><br/><br/>
                Your account has been successfully created by the organizing committee. You can now access the event portal using the details below.
              </Text>
              
              <Section style={infoBox}>
                <Text style={infoLabel}>Portal URL</Text>
                <Link href={portalUrl} style={infoLink}>{portalUrl}</Link>
                
                <Hr style={infoHr} />
                
                <Text style={infoLabel}>Login Email</Text>
                <Text style={infoValue}>{loginId}</Text>
                
                <Hr style={infoHr} />
                
                <Text style={infoLabel}>Temporary Password</Text>
                <Text style={infoValue}>{loginPass}</Text>
              </Section>

              <Heading style={supportHeading}>Need assistance?</Heading>
              
              <Text style={supportLabel}>Support:</Text>
              <Link href={supportUrl} style={supportLink}>{supportUrl}</Link>
              
              <Text style={supportLabel}>Website:</Text>
              <Link href={portalUrl} style={supportLink}>{portalUrl}</Link>
              
              <Section style={warningBox}>
                <Text style={warningText}>
                  <strong>Security Note:</strong> If you were not expecting this email, please contact the organizing committee immediately.
                </Text>
              </Section>
              
              <Text style={signOff}>
                Thank you,<br/>
                <strong>Bal Pradarshani Organizing Committee</strong>
              </Text>
              
              <Hr style={hr} />
              
              <Text style={footer}>
                This is an automated system notification regarding your Bal Pradarshani account.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default RegistrationEmail;

/* Premium Clean Email Styles */

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '40px 0',
};

const container = {
  margin: '0 auto',
  padding: '0 16px',
  maxWidth: '560px',
};

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '24px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
};

const headerDecor = {
  backgroundColor: '#2563eb',
  padding: '20px 24px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontWeight: '700',
  fontSize: '20px',
  color: '#ffffff',
  letterSpacing: '-0.02em',
  textAlign: 'center' as const,
};

const innerContent = {
  padding: '32px',
};

const tagline = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#2563eb',
  margin: '0 0 20px',
  textAlign: 'center' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
};

const text = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#334155',
  marginBottom: '24px',
};

const infoBox = {
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '20px',
  marginBottom: '28px',
  backgroundColor: '#f8fafc',
};

const infoLabel = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#64748b',
  margin: '0 0 4px',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
};

const infoValue = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#0f172a',
  margin: '0',
};

const infoLink = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#2563eb',
  textDecoration: 'none',
  margin: '0',
};

const infoHr = {
  borderColor: '#cbd5e1',
  borderTopWidth: '1px',
  borderStyle: 'solid',
  margin: '14px 0',
};

const supportHeading = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#0f172a',
  margin: '0 0 12px',
};

const supportLabel = {
  fontSize: '13px',
  fontWeight: '600',
  color: '#475569',
  margin: '0 0 2px',
};

const supportLink = {
  display: 'inline-block',
  fontSize: '13px',
  color: '#2563eb',
  textDecoration: 'none',
  marginBottom: '12px',
};

const warningBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '12px',
  border: '1px solid #bfdbfe',
  padding: '14px 16px',
  marginBottom: '24px',
};

const warningText = {
  color: '#1e40af',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
};

const signOff = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#334155',
  marginBottom: '24px',
};

const hr = {
  borderColor: '#e2e8f0',
  borderTopWidth: '1px',
  margin: '0 0 20px',
};

const footer = {
  color: '#94a3b8',
  fontSize: '11px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '0',
};
