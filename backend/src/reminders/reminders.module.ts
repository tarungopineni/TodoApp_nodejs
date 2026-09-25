import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Todo, TodoSchema } from '../todos/schemas/todo.schema';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { CronAuthGuard } from './guards/cron-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Todo.name, schema: TodoSchema }]),
    UsersModule,
    MailModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, CronAuthGuard],
  exports: [RemindersService],
})
export class RemindersModule {}
