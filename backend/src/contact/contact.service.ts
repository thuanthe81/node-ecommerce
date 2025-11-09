import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactFormDto } from './dto/contact-form.dto';
import { EmailService } from '../notifications/services/email.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async submitContactForm(contactFormDto: ContactFormDto) {
    // Log the contact form submission
    this.logger.log(`Contact form submitted by ${contactFormDto.email}`);
    this.logger.log(`Subject: ${contactFormDto.subject}`);
    this.logger.log(`Message: ${contactFormDto.message}`);

    // Send email to admin
    const adminEmail =
      this.configService.get('ADMIN_EMAIL') || 'admin@example.com';

    await this.emailService.sendEmail({
      to: adminEmail,
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

    return {
      success: true,
      message: 'Your message has been received. We will get back to you soon.',
    };
  }
}
