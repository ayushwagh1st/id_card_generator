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
          fontFamily="Space Grotesk"
          fallbackFontFamily="Helvetica"
          fontWeight={700}
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          fontWeight={400}
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          fontWeight={700}
        />
      </Head>
      <Preview>Your account has been created successfully. Use the details below to sign in.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Main Neobrutalist Card */}
          <Section style={card}>
            <div style={headerDecor}>BAL PRADARSHANI</div>
            <Section style={innerContent}>
              
              <Text style={tagline}>Official Event Management Portal</Text>
              
              <Text style={text}>
                Hello {name},<br/><br/>
                Welcome to <strong>Bal Pradarshani!</strong><br/><br/>
                Your account has been successfully created by the organizing committee. You can now access the event portal using login details below.
              </Text>
              
              <Section style={infoBox}>
                <Text style={infoLabel}>Portal</Text>
                <Link href={portalUrl} style={infoLink}>{portalUrl}</Link>
                
                <Hr style={infoHr} />
                
                <Text style={infoLabel}>Login Email</Text>
                <Text style={infoValue}>{loginId}</Text>
                
                <Hr style={infoHr} />
                
                <Text style={infoLabel}>Temporary Password</Text>
                <Text style={infoValue}>{loginPass}</Text>
              </Section>

              {/* Support Section */}
              <Heading style={supportHeading}>Need assistance?</Heading>
              
              <Text style={supportLabel}>Support:</Text>
              <Link href={supportUrl} style={supportLink}>{supportUrl}</Link>
              
              <Text style={supportLabel}>Website:</Text>
              <Link href={portalUrl} style={supportLink}>{portalUrl}</Link>
              
              {/* Warning Box */}
              <Section style={warningBox}>
                <Text style={warningText}>
                  <strong>⚠️ NOTE:</strong> If you were not expecting this email, please contact the organizing committee immediately.
                </Text>
              </Section>
              
              <Text style={signOff}>
                Thank you,<br/>
                <strong>Bal Pradarshani Organizing Committee</strong>
              </Text>
              
              <Hr style={hr} />
              
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

/* Neobrutalism Styles */

const main = {
  backgroundColor: '#ECEBFC', // pastel bg
  fontFamily: '"Inter", sans-serif',
  padding: '60px 0',
};

const container = {
  margin: '0 auto',
  padding: '0 20px',
  maxWidth: '600px',
};

const card = {
  backgroundColor: '#FFFFFF',
  border: '3px solid #111111',
  borderRadius: '0',
  boxShadow: '8px 8px 0px 0px #111111',
};

const headerDecor = {
  backgroundColor: '#D4F03B', // lime primary for welcome
  borderBottom: '3px solid #111111',
  padding: '16px 20px',
  fontFamily: '"Space Grotesk", sans-serif',
  fontWeight: '700',
  fontSize: '24px',
  color: '#111111',
  letterSpacing: '0.05em',
  textAlign: 'center' as const,
};

const innerContent = {
  padding: '30px 40px',
};

const tagline = {
  fontFamily: '"Space Grotesk", sans-serif',
  fontSize: '14px',
  fontWeight: '700',
  color: '#111111',
  margin: '0 0 24px',
  textAlign: 'center' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#111111',
  marginBottom: '24px',
};

const infoBox = {
  border: '3px solid #111111',
  padding: '20px',
  marginBottom: '32px',
  backgroundColor: '#f8f9fa',
};

const infoLabel = {
  fontFamily: '"Space Grotesk", sans-serif',
  fontSize: '12px',
  fontWeight: '700',
  color: '#111111',
  margin: '0 0 4px',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
};

const infoValue = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#111111',
  margin: '0',
};

const infoLink = {
  fontSize: '16px',
  fontWeight: '700',
  color: '#2CBCE9', // blue
  textDecoration: 'underline',
  margin: '0',
};

const infoHr = {
  borderColor: '#111111',
  borderTopWidth: '2px',
  borderStyle: 'dashed',
  margin: '16px 0',
};

const supportHeading = {
  fontFamily: '"Space Grotesk", sans-serif',
  fontSize: '18px',
  fontWeight: '700',
  color: '#111111',
  margin: '0 0 16px',
};

const supportLabel = {
  fontSize: '14px',
  fontWeight: '700',
  color: '#111111',
  margin: '0 0 4px',
};

const supportLink = {
  display: 'inline-block',
  fontSize: '14px',
  color: '#2CBCE9',
  textDecoration: 'underline',
  marginBottom: '16px',
};

const warningBox = {
  backgroundColor: '#FF99C8', // pink accent
  border: '3px solid #111111',
  padding: '16px',
  marginBottom: '32px',
  boxShadow: '4px 4px 0px 0px #111111',
};

const warningText = {
  fontFamily: '"Space Grotesk", sans-serif',
  color: '#111111',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  fontWeight: 'bold',
  letterSpacing: '0.02em',
};

const signOff = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#111111',
  marginBottom: '24px',
};

const hr = {
  borderColor: '#111111',
  borderTopWidth: '3px',
  margin: '0 0 24px',
};

const footer = {
  fontFamily: '"Space Grotesk", sans-serif',
  color: 'rgba(17,17,17,0.7)',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  margin: '0',
  letterSpacing: '0.02em',
};
