import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { DailyTask, DailyTaskDocument } from './schemas/daily-task.schema';
import { DailyTaskCompletion, DailyTaskCompletionDocument } from './schemas/daily-task-completion.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateDailyTaskDto } from './dto/create-daily-task.dto';
import { UpdateDailyTaskDto } from './dto/update-daily-task.dto';
import { addDays, getDatesBetween, getISTDateString } from './utils/date.util';

export interface SyncResponse {
  synced: boolean;
  date: string;
  resetCount: number;
}

export interface ProgressSummary {
  todayCompleted: number;
  todayTotal: number;
  todayPercentage: number;
  currentStreak: number;
  bestStreak: number;
  totalCompletedDays: number;
}

export interface HistoryDay {
  date: string;
  percentage: number;
  completedCount: number;
  totalCount: number;
}

@Injectable()
export class DailyTasksService {
  constructor(
    @InjectModel(DailyTask.name) private dailyTaskModel: Model<DailyTaskDocument>,
    @InjectModel(DailyTaskCompletion.name) private completionModel: Model<DailyTaskCompletionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createDto: CreateDailyTaskDto, userId: string): Promise<DailyTaskDocument> {
    const today = getISTDateString();
    const createdTask = new this.dailyTaskModel({
      ...createDto,
      priority: createDto.priority || 3,
      complete: false,
      creationDate: today,
      owner_id: userId,
    });
    return createdTask.save();
  }

  async findAllForUser(userId: string): Promise<DailyTaskDocument[]> {
    return this.dailyTaskModel.find({ owner_id: userId }).sort({ createdAt: -1 }).exec();
  }

  async findOneForUser(id: string, userId: string): Promise<DailyTaskDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Daily Task not found');
    }

    const task = await this.dailyTaskModel.findById(id);
    if (!task) {
      throw new NotFoundException('Daily Task not found');
    }

    if (task.owner_id.toString() !== userId) {
      throw new ForbiddenException('Access forbidden. You do not own this daily task.');
    }

    return task;
  }

  async toggleCompletion(id: string, userId: string): Promise<DailyTaskDocument> {
    const task = await this.findOneForUser(id, userId);
    const newStatus = !task.complete;
    task.complete = newStatus;
    await task.save();

    const today = getISTDateString();

    await this.completionModel.findOneAndUpdate(
      { dailyTaskId: task._id, date: today },
      {
        $set: {
          userId,
          completed: newStatus,
          completedAt: newStatus ? new Date() : null,
        },
      },
      { upsert: true, new: true },
    ).exec();

    return task;
  }

  async update(id: string, updateDto: UpdateDailyTaskDto, userId: string): Promise<DailyTaskDocument> {
    await this.findOneForUser(id, userId);

    const updatedTask = await this.dailyTaskModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true },
    );

    if (!updatedTask) {
      throw new NotFoundException('Daily Task not found');
    }

    return updatedTask;
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOneForUser(id, userId);

    // Delete task and purge its completion history completely
    await this.dailyTaskModel.findByIdAndDelete(id);
    await this.completionModel.deleteMany({ dailyTaskId: id });
  }

  async syncUserDailyTasks(userId: string): Promise<SyncResponse> {
    const today = getISTDateString();
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const lastSync = user.lastDailyTaskSyncDate;

    // If already synced today, do nothing
    if (lastSync === today) {
      return {
        synced: false,
        date: today,
        resetCount: 0,
      };
    }

    const tasks = await this.dailyTaskModel.find({ owner_id: userId }).exec();

    if (lastSync) {
      const yesterday = addDays(today, -1);

      if (lastSync <= yesterday) {
        // 1. Finalize lastSync date using task.complete if no record exists yet
        for (const task of tasks) {
          if (task.creationDate <= lastSync) {
            const existingRecord = await this.completionModel.findOne({
              dailyTaskId: task._id,
              date: lastSync,
            });

            if (!existingRecord) {
              await this.completionModel.create({
                dailyTaskId: task._id,
                userId,
                date: lastSync,
                completed: task.complete,
                completedAt: task.complete ? new Date() : null,
              });
            }
          }
        }

        // 2. Handle missed dates after lastSync up to yesterday
        const missedStartDate = addDays(lastSync, 1);
        if (missedStartDate <= yesterday) {
          const missedDates = getDatesBetween(missedStartDate, yesterday);
          for (const missedDate of missedDates) {
            for (const task of tasks) {
              // Only record history if task existed on missedDate
              if (task.creationDate <= missedDate) {
                const existing = await this.completionModel.findOne({
                  dailyTaskId: task._id,
                  date: missedDate,
                });
                if (!existing) {
                  await this.completionModel.create({
                    dailyTaskId: task._id,
                    userId,
                    date: missedDate,
                    completed: false,
                    completedAt: null,
                  });
                }
              }
            }
          }
        }
      }
    }

    // Reset current active Daily Tasks to complete = false for today
    await this.dailyTaskModel.updateMany(
      { owner_id: userId },
      { $set: { complete: false } },
    );

    // Update user's sync date
    user.lastDailyTaskSyncDate = today;
    await user.save();

    return {
      synced: true,
      date: today,
      resetCount: tasks.length,
    };
  }

  async getProgress(userId: string): Promise<ProgressSummary> {
    const today = getISTDateString();
    const tasks = await this.dailyTaskModel.find({ owner_id: userId }).exec();

    const todayCompleted = tasks.filter((t) => t.complete).length;
    const todayTotal = tasks.length;
    const todayPercentage = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

    // Fetch all completions for this user
    const completions = await this.completionModel.find({ userId }).exec();

    // Group completion records by date
    const completionByDateMap = new Map<string, Map<string, boolean>>();
    for (const comp of completions) {
      const taskId = comp.dailyTaskId.toString();
      if (!completionByDateMap.has(comp.date)) {
        completionByDateMap.set(comp.date, new Map());
      }
      completionByDateMap.get(comp.date)!.set(taskId, comp.completed);
    }

    // Also include today's live state in date map if tasks exist
    if (todayTotal > 0) {
      if (!completionByDateMap.has(today)) {
        completionByDateMap.set(today, new Map());
      }
      for (const t of tasks) {
        const taskId = (t._id ? t._id.toString() : t.id);
        // If not explicitly recorded in completionModel yet today, use current live state
        if (!completionByDateMap.get(today)!.has(taskId)) {
          completionByDateMap.get(today)!.set(taskId, t.complete);
        }
      }
    }

    // Get sorted unique dates
    const sortedDates = Array.from(completionByDateMap.keys()).sort();

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let totalCompletedDays = 0;

    for (const dateStr of sortedDates) {
      const dateMap = completionByDateMap.get(dateStr)!;

      // Count tasks that existed on this date
      const activeTasksOnDate = tasks.filter((t) => t.creationDate <= dateStr);
      if (activeTasksOnDate.length === 0) {
        continue;
      }

      let completedOnDateCount = 0;
      for (const t of activeTasksOnDate) {
        const taskId = (t._id ? t._id.toString() : t.id);
        if (dateMap.get(taskId) === true) {
          completedOnDateCount++;
        }
      }

      const isFullCompletion =
        completedOnDateCount === activeTasksOnDate.length && activeTasksOnDate.length > 0;

      if (completedOnDateCount > 0) {
        totalCompletedDays++;
      }

      if (isFullCompletion) {
        tempStreak++;
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current streak ending at latest date
    let streakPointer = sortedDates.length - 1;

    // If today is in dates but not full yet, check if yesterday was full
    if (sortedDates.length > 0) {
      const latestDate = sortedDates[streakPointer];
      const latestMap = completionByDateMap.get(latestDate)!;
      const activeOnLatest = tasks.filter((t) => t.creationDate <= latestDate);
      let countOnLatest = 0;
      for (const t of activeOnLatest) {
        const taskId = (t._id ? t._id.toString() : t.id);
        if (latestMap.get(taskId) === true) countOnLatest++;
      }
      const isLatestFull = countOnLatest === activeOnLatest.length && activeOnLatest.length > 0;

      if (latestDate === today && !isLatestFull) {
        // Today is not full yet, so streak counts from yesterday backwards
        streakPointer--;
      }
    }

    while (streakPointer >= 0) {
      const dateStr = sortedDates[streakPointer];
      const dateMap = completionByDateMap.get(dateStr)!;
      const activeOnDate = tasks.filter((t) => t.creationDate <= dateStr);

      if (activeOnDate.length === 0) {
        streakPointer--;
        continue;
      }

      let countOnDate = 0;
      for (const t of activeOnDate) {
        const taskId = (t._id ? t._id.toString() : t.id);
        if (dateMap.get(taskId) === true) countOnDate++;
      }

      if (countOnDate === activeOnDate.length && activeOnDate.length > 0) {
        currentStreak++;
        streakPointer--;
      } else {
        break;
      }
    }

    return {
      todayCompleted,
      todayTotal,
      todayPercentage,
      currentStreak,
      bestStreak,
      totalCompletedDays,
    };
  }

  async getHistory(userId: string, days = 7): Promise<HistoryDay[]> {
    const today = getISTDateString();
    const startDate = addDays(today, -(days - 1));
    const dates = getDatesBetween(startDate, today);

    const tasks = await this.dailyTaskModel.find({ owner_id: userId }).exec();
    const completions = await this.completionModel.find({ userId }).exec();

    const completionMap = new Map<string, Map<string, boolean>>();
    for (const comp of completions) {
      if (!completionMap.has(comp.date)) {
        completionMap.set(comp.date, new Map());
      }
      completionMap.get(comp.date)!.set(comp.dailyTaskId.toString(), comp.completed);
    }

    const history: HistoryDay[] = [];

    for (const d of dates) {
      const activeTasksOnDate = tasks.filter((t) => t.creationDate <= d);
      const totalCount = activeTasksOnDate.length;

      let completedCount = 0;
      if (totalCount > 0) {
        if (d === today) {
          // Use live state for today
          completedCount = activeTasksOnDate.filter((t) => t.complete).length;
        } else {
          const dateMap = completionMap.get(d);
          if (dateMap) {
            for (const t of activeTasksOnDate) {
              const taskId = (t._id ? t._id.toString() : t.id);
              if (dateMap.get(taskId) === true) {
                completedCount++;
              }
            }
          }
        }
      }

      const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
      history.push({
        date: d,
        percentage,
        completedCount,
        totalCount,
      });
    }

    return history;
  }
}
