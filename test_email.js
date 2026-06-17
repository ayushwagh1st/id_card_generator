const { Resend } = require('resend');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('Testing Resend with API Key:', process.env.RESEND_API_KEY ? 'Loaded (starts with ' + process.env.RESEND_API_KEY.substring(0, 5) + '...)' : 'MISSING');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Bal Pradarshani <onboarding@resend.dev>',
      to: ['delivered@resend.dev'], // Resend's official test address
      subject: 'Hello World from Bal Pradarshani',
      html: '<p>It works! Your Resend configuration is perfectly fine.</p>',
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
    } else {
      console.log('✅ Success! Email sent to delivered@resend.dev');
      console.log('Response Data:', data);
    }
  } catch (err) {
    console.error('❌ Caught Exception:', err);
  }
}

testEmail();
