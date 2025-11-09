import { Injectable, Logger } from '@nestjs/common';
import { ContactFormDto } from './dto/contact-form.dto';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  async submitContactForm(contactFormDto: ContactFormDto) {
    // Log the contact form submission
    this.logger.log(`Contact form submitted by ${contactFormDto.email}`);
    this.logger.log(`Subject: ${contactFormDto.subject}`);
    this.logger.log(`Message: ${contactFormDto.message}`);

    // TODO: In a production environment, you would:
    // 1. Send an email to the admin using a service like SendGrid, AWS SES, or Nodemailer
    // 2. Store the contact form submission in the database for tracking
    // 3. Send an auto-reply email to the customer confirming receipt
    
    // For now, we'll just return a success response
    // Example email sending code (commented out):
    /*
    await this.emailService.send({
      to: process.env.ADMIN_EMAIL,
      subject: `Contact Form: ${contactFormDto.subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${contactFormDto.name}</p>
        <p><strong>Email:</strong> ${contactFormDto.email}</p>
        <p><strong>Subject:</strong> ${contactFormDto.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${contactFormDto.message}</p>
      `,
    });
    */

    return {
      success: true,
      message: 'Your message has been received. We will get back to you soon.',
    };
  }
}
