const SibApiV3Sdk = require('sib-api-v3-sdk');

class BrevoService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.defaultSender = {
      email: process.env.DEFAULT_FROM_EMAIL || 'citycollegeofbayawan@gmail.com',
      name: 'City College of Bayawan'
    };
    this.contactInbox = process.env.CONTACT_INBOX || 'citycollegeofbayawan@gmail.com';
    
    // Initialize Brevo API client
    if (this.apiKey) {
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = this.apiKey;
    }
  }

  async sendEmail(options) {
    if (!this.apiKey) {
      throw new Error('Brevo API key not configured');
    }

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = options.sender || this.defaultSender;
    sendSmtpEmail.to = options.to;
    sendSmtpEmail.subject = options.subject;
    sendSmtpEmail.htmlContent = options.html;
    sendSmtpEmail.textContent = options.text;
    
    if (options.replyTo) {
      sendSmtpEmail.replyTo = options.replyTo;
    }

    try {
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('Email sent successfully via Brevo:', data.messageId);
      return { success: true, messageId: data.messageId };
    } catch (error) {
      console.error('Brevo API Error:', error);
      throw new Error(`Failed to send email via Brevo: ${error.message}`);
    }
  }

  async sendContactVerification(email, name, verificationLink) {
    const html = `
      <div style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:0 auto;">
        <div style="background:#f8f9fa; padding:20px; text-align:center; border-bottom:3px solid #007bff;">
          <h2 style="color:#007bff; margin:0;">City College of Bayawan</h2>
          <p style="margin:5px 0;">Contact Form Verification</p>
        </div>
        
        <div style="padding:30px 20px;">
          <h3>Hello ${name},</h3>
          <p>Thank you for contacting City College of Bayawan! To ensure your message reaches us safely, please verify your email address by clicking the button below:</p>
          
          <div style="text-align:center; margin:30px 0;">
            <a href="${verificationLink}" 
               style="background:#007bff; color:white; padding:12px 30px; text-decoration:none; border-radius:5px; display:inline-block; font-weight:bold;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color:#666; font-size:14px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break:break-all; color:#007bff; font-size:12px;">${verificationLink}</p>
          
          <p style="margin-top:30px; padding-top:20px; border-top:1px solid #eee; color:#666; font-size:12px;">
            This verification link will expire in 24 hours. If you didn't submit this contact form, please ignore this email.
          </p>
        </div>
        
        <div style="background:#f8f9fa; padding:15px; text-align:center; color:#666; font-size:11px; border-top:1px solid #ddd;">
          <p>© ${new Date().getFullYear()} City College of Bayawan. All rights reserved.</p>
          <p>Government Center, Banga, Bayawan City, Negros Oriental, Philippines</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: [{ email }],
      subject: 'Verify Your Contact Form Submission - City College of Bayawan',
      html,
      text: `Hello ${name},\n\nPlease verify your email address by visiting: ${verificationLink}\n\nThis link expires in 24 hours.`
    });
  }

  async sendContactNotification(contactData) {
    const { name, email, phone, subject, message } = contactData;
    
    const html = `
      <div style="font-family: Arial, sans-serif; color:#333; max-width:600px; margin:0 auto;">
        <div style="background:#f8f9fa; padding:20px; text-align:center; border-bottom:3px solid #28a745;">
          <h2 style="color:#28a745; margin:0;">City College of Bayawan</h2>
          <p style="margin:5px 0;">New Contact Form Message</p>
        </div>
        
        <div style="padding:30px 20px;">
          <h3 style="color:#28a745;">✓ Verified Contact Message Received</h3>
          
          <div style="background:#f8f9fa; padding:20px; border-radius:5px; margin:20px 0;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background:#fff; border-left:4px solid #007bff; padding:15px; margin:20px 0;">
            <h4 style="margin-top:0;">Message:</h4>
            <p style="white-space:pre-wrap; margin:0;">${message}</p>
          </div>
          
          <div style="text-align:center; margin:30px 0;">
            <a href="mailto:${email}" 
               style="background:#007bff; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; display:inline-block;">
              Reply to Sender
            </a>
          </div>
        </div>
        
        <div style="background:#f8f9fa; padding:15px; text-align:center; color:#666; font-size:11px; border-top:1px solid #ddd;">
          <p>© ${new Date().getFullYear()} City College of Bayawan. All rights reserved.</p>
          <p>This message was sent from the verified contact form on the official website.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: [{ email: this.contactInbox }],
      subject: `[Contact Form] ${subject}`,
      html,
      text: `New verified contact message from ${name} (${email}):\n\nPhone: ${phone || 'N/A'}\nSubject: ${subject}\n\nMessage:\n${message}`,
      replyTo: { email }
    });
  }
}

module.exports = new BrevoService();
