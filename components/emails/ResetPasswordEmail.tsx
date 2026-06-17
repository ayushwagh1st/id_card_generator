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

interface ResetPasswordEmailProps {
  resetLink: string;
}

export const ResetPasswordEmail = ({
  resetLink,
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Space Grotesk"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/spacegrotesk/v15/V8mQoQDjQSkGpu8pn628QvLup4A.woff2',
            format: 'woff2',
          }}
          fontWeight={700}
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
        />
      </Head>
      <Preview>Reset your password for Bal Pradarshani</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Main Neobrutalist Card */}
          <Section style={card}>
            <div style={headerDecor}>BAL PRADARSHANI</div>
            <Section style={innerContent}>
              <Heading style={heading}>LOST THE KEY?</Heading>
              
              <Text style={text}>
                We received a request to reset your password. 
                Click the button below to securely update your credentials.
              </Text>
              
              {/* Action Button */}
              <Section style={btnContainer}>
                <Link href={resetLink} style={button}>
                  RESET PASSWORD &rarr;
                </Link>
              </Section>
              
              {/* Warning Box */}
              <Section style={warningBox}>
                <Text style={warningText}>
                  <strong>⚠️ WARNING:</strong> If you did not request this email, please ignore it. Your password will remain safely unchanged.
                </Text>
              </Section>
              
              <Hr style={hr} />
              
              <Text style={footer}>
                THIS IS AN AUTOMATED EMAIL FROM THE BAL PRADARSHANI SYSTEM.<br/>PLEASE DO NOT REPLY.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ResetPasswordEmail;

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
  // Hard offset shadow
  boxShadow: '8px 8px 0px 0px #111111',
};

const headerDecor = {
  backgroundColor: '#FF99C8', // pink primary for reset
  borderBottom: '3px solid #111111',
  padding: '12px 20px',
  fontFamily: '"Space Grotesk", sans-serif',
  fontWeight: '700',
  fontSize: '18px',
  color: '#111111',
  letterSpacing: '0.05em',
};

const innerContent = {
  padding: '40px',
};

const heading = {
  fontFamily: '"Space Grotesk", sans-serif',
  fontSize: '32px',
  fontWeight: '700',
  color: '#111111',
  margin: '0 0 24px',
  lineHeight: '1.1',
  textTransform: 'uppercase' as const,
};

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#111111',
  marginBottom: '32px',
};

const warningBox = {
  backgroundColor: '#D4F03B', // lime accent instead of destructive red for reset
  border: '3px solid #111111',
  padding: '20px',
  marginBottom: '40px',
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

const btnContainer = {
  textAlign: 'center' as const,
  marginBottom: '40px',
};

const button = {
  backgroundColor: '#2CBCE9', // blue primary
  border: '3px solid #111111',
  color: '#111111',
  fontFamily: '"Space Grotesk", sans-serif',
  fontSize: '18px',
  fontWeight: '700',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  boxShadow: '6px 6px 0px 0px #111111',
  textTransform: 'uppercase' as const,
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
  letterSpacing: '0.05em',
};
