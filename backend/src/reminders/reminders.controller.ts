import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { RemindersService, ReminderCheckResult, TestSendResult } from './reminders.service';
import { CronAuthGuard } from './guards/cron-auth.guard';

@Controller('internal/reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('check')
  @UseGuards(CronAuthGuard)
  @HttpCode(HttpStatus.OK)
  async checkReminders(): Promise<ReminderCheckResult> {
    return this.remindersService.checkAndSendReminders();
  }

  @Post('test-send')
  @HttpCode(HttpStatus.OK)
  async testSendReminders(): Promise<TestSendResult> {
    return this.remindersService.testSendReminders();
  }
}
