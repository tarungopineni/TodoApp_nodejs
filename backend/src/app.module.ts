import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TodosModule } from './todos/todos.module';
import { MailModule } from './mail/mail.module';
import { RemindersModule } from './reminders/reminders.module';
import { DailyTasksModule } from './daily-tasks/daily-tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/todoapp',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    TodosModule,
    MailModule,
    RemindersModule,
    DailyTasksModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
