// hello
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDailyTaskDto } from './dto/create-daily-task.dto';
import { UpdateDailyTaskDto } from './dto/update-daily-task.dto';
import { DailyTasksService } from './daily-tasks.service';

@UseGuards(JwtAuthGuard)
@Controller('daily-tasks')
export class DailyTasksController {
  constructor(private readonly dailyTasksService: DailyTasksService) {}

  @Get()
  async getDailyTasks(@Req() req: any) {
    const tasks = await this.dailyTasksService.findAllForUser(req.user.userId);
    return tasks.map((t) => t.toJSON());
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDailyTask(@Body() dto: CreateDailyTaskDto, @Req() req: any) {
    const task = await this.dailyTasksService.create(dto, req.user.userId);
    return {
      message: 'Daily task created successfully',
      dailyTask: task.toJSON(),
    };
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncDailyTasks(@Req() req: any) {
    return this.dailyTasksService.syncUserDailyTasks(req.user.userId);
  }

  @Get('progress')
  async getProgress(@Req() req: any) {
    return this.dailyTasksService.getProgress(req.user.userId);
  }

  @Get('history')
  async getHistory(@Query('days') days: string, @Req() req: any) {
    const numDays = parseInt(days, 10) || 7;
    return this.dailyTasksService.getHistory(req.user.userId, numDays);
  }

  @Put(':id')
  async updateDailyTask(
    @Param('id') id: string,
    @Body() dto: UpdateDailyTaskDto,
    @Req() req: any,
  ) {
    const task = await this.dailyTasksService.update(id, dto, req.user.userId);
    return {
      message: 'Daily task updated successfully',
      dailyTask: task.toJSON(),
    };
  }

  @Patch(':id/toggle')
  async toggleDailyTask(@Param('id') id: string, @Req() req: any) {
    const task = await this.dailyTasksService.toggleCompletion(id, req.user.userId);
    return {
      message: 'Daily task status toggled successfully',
      dailyTask: task.toJSON(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteDailyTask(@Param('id') id: string, @Req() req: any) {
    await this.dailyTasksService.remove(id, req.user.userId);
    return { message: 'Daily task deleted successfully' };
  }
}
