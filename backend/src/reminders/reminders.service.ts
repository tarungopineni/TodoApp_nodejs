import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Todo, TodoDocument } from '../todos/schemas/todo.schema';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

export interface ReminderCheckResult {
  checked: number;
  sent: number;
  failed: number;
}

export interface TestSendResult {
  eligible: number;
  sent: number;
  failed: number;
  results: Array<{
    todoId: string;
    email: string;
    status: 'sent' | 'failed';
    error?: string;
  }>;
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    @InjectModel(Todo.name) private readonly todoModel: Model<TodoDocument>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async checkAndSendReminders(): Promise<ReminderCheckResult> {
    const nowMs = Date.now();
    const oneHourFromNowMs = nowMs + 60 * 60 * 1000;

    // Find candidate incomplete todos where mailSent is false or not set, and deadline is present
    const candidates = await this.todoModel.find({
      complete: false,
      $or: [{ mailSent: false }, { mailSent: { $exists: false } }],
      deadline: { $ne: null, $exists: true },
    }).exec();

    let checked = 0;
    let sent = 0;
    let failed = 0;

    for (const todo of candidates) {
      if (!todo.deadline || todo.mailSent) {
        continue;
      }

      const deadlineMs = new Date(todo.deadline).getTime();
      if (isNaN(deadlineMs)) {
        continue;
      }

      // Check if deadline is within [now, now + 1 hour]
      if (deadlineMs >= nowMs && deadlineMs <= oneHourFromNowMs) {
        checked++;
        try {
          const owner = await this.usersService.findById(todo.owner_id.toString());
          if (owner && owner.email) {
            const success = await this.mailService.sendReminderEmail(
              owner.email,
              todo.title,
              todo.description,
              todo.deadline,
            );

            if (success) {
              todo.mailSent = true;
              await todo.save();
              sent++;
            } else {
              failed++;
            }
          } else {
            failed++;
          }
        } catch (err: any) {
          this.logger.error(`Error processing reminder for todo ${todo._id}: ${err?.message || err}`);
          failed++;
        }
      }
    }

    return { checked, sent, failed };
  }

  async testSendReminders(): Promise<TestSendResult> {
    const nowMs = Date.now();
    const oneHourFromNowMs = nowMs + 60 * 60 * 1000;

    const candidates = await this.todoModel.find({
      complete: false,
      $or: [{ mailSent: false }, { mailSent: { $exists: false } }],
      deadline: { $ne: null, $exists: true },
    }).exec();

    let eligible = 0;
    let sent = 0;
    let failed = 0;
    const results: Array<{
      todoId: string;
      email: string;
      status: 'sent' | 'failed';
      error?: string;
    }> = [];

    for (const todo of candidates) {
      if (!todo.deadline) continue;

      const deadlineMs = new Date(todo.deadline).getTime();
      if (isNaN(deadlineMs)) continue;

      if (deadlineMs >= nowMs && deadlineMs <= oneHourFromNowMs) {
        eligible++;
        const todoId = todo._id ? todo._id.toString() : (todo.id || '');
        let email = '';

        try {
          const owner = await this.usersService.findById(todo.owner_id.toString());
          if (owner && owner.email) {
            email = owner.email;
            const success = await this.mailService.sendReminderEmail(
              owner.email,
              todo.title,
              todo.description,
              todo.deadline,
            );

            if (success) {
              sent++;
              results.push({
                todoId,
                email,
                status: 'sent',
              });
              // Leave mailSent unchanged so user can test repeatedly
            } else {
              failed++;
              results.push({
                todoId,
                email,
                status: 'failed',
                error: 'MailService returned false (SMTP delivery failed)',
              });
            }
          } else {
            failed++;
            results.push({
              todoId,
              email: owner?.email || 'Unknown',
              status: 'failed',
              error: 'Owner email not found',
            });
          }
        } catch (err: any) {
          failed++;
          results.push({
            todoId,
            email,
            status: 'failed',
            error: err?.message || 'Error processing reminder',
          });
        }
      }
    }

    return { eligible, sent, failed, results };
  }
}
