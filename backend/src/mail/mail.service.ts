import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<number>('SMTP_PORT')) || 587;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user ? { user, pass } : undefined,
      });
    }
  }

  async sendReminderEmail(
    to: string,
    title: string,
    description: string,
    deadline: string,
  ): Promise<boolean> {
    const from = this.configService.get<string>('SMTP_FROM') || 'noreply@todoapp.com';

    if (!this.transporter) {
      this.initTransporter();
    }

    if (!this.transporter) {
      this.logger.warn(`SMTP host not configured. Skipping sending email to ${to}.`);
      return false;
    }

    const text = `Hello,\n\nYour task "${title}" has an approaching deadline!\n\nDescription: ${description}\nDeadline: ${deadline}\n\nPlease make sure to complete it on time.\n`;
    const html = `
      <h2>Task Deadline Reminder</h2>
      <p>Your task <strong>${title}</strong> has an approaching deadline!</p>
      <p><strong>Description:</strong> ${description}</p>
      <p><strong>Deadline:</strong> ${deadline}</p>
      <p>Please make sure to complete it on time.</p>
    `;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `Reminder: Task "${title}" deadline is approaching`,
        text,
        html,
      });
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send reminder email to ${to}: ${error?.message || error}`);
      return false;
    }
  }
}
