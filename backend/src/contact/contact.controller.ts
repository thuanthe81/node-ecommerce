import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { ContactFormDto } from './dto/contact-form.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Public()
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 submissions per 5 minutes
  async submitContactForm(@Body() contactFormDto: ContactFormDto) {
    return this.contactService.submitContactForm(contactFormDto);
  }
}
