import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactFormDto } from './dto/contact-form.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Public()
  async submitContactForm(@Body() contactFormDto: ContactFormDto) {
    return this.contactService.submitContactForm(contactFormDto);
  }
}
