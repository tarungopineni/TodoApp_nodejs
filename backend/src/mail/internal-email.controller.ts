import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { CronAuthGuard } from '../reminders/guards/cron-auth.guard';

@Controller('internal/email')
export class InternalEmailController {
  private readonly logger = new Logger(InternalEmailController.name);

  constructor(
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  @Post('test')
  @UseGuards(CronAuthGuard)
  @HttpCode(HttpStatus.OK)
  testEmail(@Body() body: any) {
    const to =
      body?.to ||
      this.configService.get<string>('SMTP_USER') ||
      this.configService.get<string>('SMTP_FROM') ||
      'test@example.com';

    // Initiate SMTP send asynchronously in background (do NOT await)
    this.mailService
      .sendReminderEmail(
        to,
        'Test Task',
        'This is a test email sent from NestJS backend',
        new Date().toISOString(),
      )
      .then((success) => {
        if (success) {
          this.logger.log('Test email sent successfully');
        } else {
          this.logger.error('Test email sending failed');
        }
      })
      .catch((err: any) => {
        this.logger.error(`Test email error: ${err?.message || err}`);
      });

    // Return HTTP response immediately
    return {
      success: true,
      message: 'Email sending initiated',
    };
  }
}
