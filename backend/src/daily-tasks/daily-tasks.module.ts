import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyTask, DailyTaskSchema } from './schemas/daily-task.schema';
import { DailyTaskCompletion, DailyTaskCompletionSchema } from './schemas/daily-task-completion.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { DailyTasksController } from './daily-tasks.controller';
import { DailyTasksService } from './daily-tasks.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DailyTask.name, schema: DailyTaskSchema },
      { name: DailyTaskCompletion.name, schema: DailyTaskCompletionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [DailyTasksController],
  providers: [DailyTasksService],
  exports: [DailyTasksService],
})
export class DailyTasksModule {}
