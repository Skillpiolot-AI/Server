const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: 'no-reply@pratimesh.com',
    pass: 'Ujjwaljha_12',
  },
});

async function test() {
  console.log('Testing SMTP connection (STARTTLS)...');
  try {
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully');

    const info = await transporter.sendMail({
      from: {
        name: 'SMTP Test',
        address: 'no-reply@pratimesh.com',
      },
      to: 'ujjwaljha.personal@gmail.com',
      subject: 'SMTP Diagnostic Test (STARTTLS)',
      text: 'This is a test email to verify SMTP configuration on port 587.',
    });

    console.log('✅ Test email sent:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Test failed:');
    console.error('Code:', error.code);
    console.error('Response:', error.response);
    console.error('Message:', error.message);
  }
}

test();
