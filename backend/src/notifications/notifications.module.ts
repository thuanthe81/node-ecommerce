import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { FooterSettingsModule } from '../footer-settings/footer-settings.module';

@Module({
  imports: [FooterSettingsModule],
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService, EmailTemplateService],
})
export class NotificationsModule {}
