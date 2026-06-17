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
  Hr
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
  return (
    <Html>
      <Head />
      <Preview>Welcome to Bal Pradarshani - Your Credentials Inside</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={card}>
            <div style={headerDecor}></div>
            <Section style={innerContent}>
              <Heading style={heading}>Welcome, {name}!</Heading>
              <Text style={text}>
                You have been registered as a <strong>{role}</strong> for the Bal Pradarshani event. 
                Please use the credentials below to log into the portal.
              </Text>
              
              <Section style={credentialsBox}>
                <Text style={credentialItem}>
                  <strong>Website URL:</strong>{' '}
                  <Link href={websiteUrl} style={link}>
                    {websiteUrl}
                  </Link>
                </Text>
                <Text style={credentialItem}>
                  <strong>Login ID:</strong> {loginId}
                </Text>
                <Text style={credentialItem}>
                  <strong>Password:</strong> {loginPass}
                </Text>
              </Section>
              
              <Section style={warningBox}>
                <Text style={warningText}>
                  <strong>⚠️ STRICT WARNING:</strong> Do not share this link or your credentials with anyone. Your account contains sensitive access privileges.
                </Text>
              </Section>

              <Section style={btnContainer}>
                <Link href={websiteUrl} style={button}>
                  Access Portal
                </Link>
              </Section>
              
              <Hr style={hr} />
              
              <Text style={footer}>
                This is an automated email from the Bal Pradarshani System. Please do not reply.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default RegistrationEmail;

const main = {
  backgroundColor: '#f0f4f8',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  padding: '40px 0',
};

const container = {
  margin: '0 auto',
  padding: '0 20px',
  maxWidth: '600px',
};

const card = {
  backgroundColor: '#e0e5ec',
  borderRadius: '24px',
  overflow: 'hidden',
  // Neumorphic shadow
  boxShadow: '9px 9px 16px rgb(163,177,198,0.6), -9px -9px 16px rgba(255,255,255, 0.5)',
};

const headerDecor = {
  height: '8px',
  background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
  width: '100%',
};

const innerContent = {
  padding: '40px',
};

const heading = {
  fontSize: '28px',
  fontWeight: '800',
  color: '#2d3748',
  margin: '0 0 20px',
  letterSpacing: '-0.5px',
};

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4a5568',
  marginBottom: '24px',
};

const credentialsBox = {
  backgroundColor: '#e0e5ec',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '24px',
  // Inset shadow for neumorphism
  boxShadow: 'inset 6px 6px 10px 0 rgba(163,177,198, 0.5), inset -6px -6px 10px 0 rgba(255,255,255, 0.8)',
};

const credentialItem = {
  fontSize: '15px',
  color: '#2d3748',
  margin: '0 0 12px 0',
};

const link = {
  color: '#6366f1',
  textDecoration: 'none',
  fontWeight: '600',
};

const warningBox = {
  backgroundColor: '#fee2e2',
  borderLeft: '4px solid #ef4444',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '28px',
};

const warningText = {
  color: '#b91c1c',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const btnContainer = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#e0e5ec',
  borderRadius: '12px',
  color: '#6366f1',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  boxShadow: '6px 6px 12px rgba(163,177,198,0.6), -6px -6px 12px rgba(255,255,255, 0.8)',
  transition: 'all 0.2s ease-in-out',
};

const hr = {
  borderColor: '#cbd5e1',
  margin: '0 0 20px',
};

const footer = {
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '0',
};
