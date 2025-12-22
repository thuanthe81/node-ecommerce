import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { EmailTemplateService } from './services/email-template.service';
import { FooterSettingsModule } from '../footer-settings/footer-settings.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [FooterSettingsModule, CommonModule],
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService, EmailTemplateService],
})
export class NotificationsModule {}
