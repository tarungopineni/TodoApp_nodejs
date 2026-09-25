import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { InternalEmailController } from './internal-email.controller';
import { CronAuthGuard } from '../reminders/guards/cron-auth.guard';

@Module({
  controllers: [InternalEmailController],
  providers: [MailService, CronAuthGuard],
  exports: [MailService],
})
export class MailModule {}
