import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactFormDto } from './dto/contact-form.dto';
import { EmailEventPublisher } from '../email-queue/services/email-event-publisher.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private emailEventPublisher: EmailEventPublisher,
    private configService: ConfigService,
  ) {}

  async submitContactForm(contactFormDto: ContactFormDto) {
    // Log the contact form submission
    this.logger.log(`Contact form submitted by ${contactFormDto.email}`);
    this.logger.log(`Subject: ${contactFormDto.subject}`);
    this.logger.log(`Message: ${contactFormDto.message}`);

    try {
      const locale = 'en'; // Default to English
      const message = `Subject: ${contactFormDto.subject}\n\n${contactFormDto.message}`;

      // Publish contact form event to queue
      const jobId = await this.emailEventPublisher.sendContactForm(
        contactFormDto.name,
        contactFormDto.email,
        message,
        locale
      );

      this.logger.log(`Contact form event published for ${contactFormDto.email} (Job ID: ${jobId})`);

      return {
        success: true,
        message: 'Your message has been received. We will get back to you soon.',
      };
    } catch (error) {
      this.logger.error('Failed to publish contact form event:', error);

      return {
        success: false,
        message: 'Failed to submit your message. Please try again later.',
      };
    }
  }
}
