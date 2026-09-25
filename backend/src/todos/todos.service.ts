import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Todo, TodoDocument } from './schemas/todo.schema';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class TodosService {
  private readonly logger = new Logger(TodosService.name);

  constructor(
    @InjectModel(Todo.name) private todoModel: Model<TodoDocument>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Find all Todos belonging to the authenticated user
   */
  async findAllForUser(userId: string): Promise<TodoDocument[]> {
    return this.todoModel.find({ owner_id: userId }).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find a specific Todo by ID ensuring user ownership
   */
  async findOneForUser(id: string, userId: string): Promise<TodoDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Todo not found');
    }

    const todo = await this.todoModel.findById(id);
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    if (todo.owner_id.toString() !== userId) {
      throw new ForbiddenException('Access forbidden. You do not own this todo.');
    }

    return todo;
  }

  /**
   * Create a new Todo for the authenticated user
   */
  async create(createTodoDto: CreateTodoDto, userId: string): Promise<TodoDocument> {
    const now = new Date();

    if (createTodoDto.task_datetime) {
      const start = new Date(createTodoDto.task_datetime);
      if (!isNaN(start.getTime()) && start < now) {
        throw new BadRequestException('Start time cannot be in the past.');
      }
    }

    if (createTodoDto.deadline) {
      const end = new Date(createTodoDto.deadline);
      if (!isNaN(end.getTime()) && end < now) {
        throw new BadRequestException('Deadline cannot be in the past.');
      }
    }

    if (createTodoDto.task_datetime && createTodoDto.deadline) {
      const start = new Date(createTodoDto.task_datetime);
      const end = new Date(createTodoDto.deadline);
      if (
        !isNaN(start.getTime()) &&
        !isNaN(end.getTime()) &&
        end < start
      ) {
        throw new BadRequestException('Deadline cannot be before the task start time.');
      }
    }

    const createdTodo = new this.todoModel({
      ...createTodoDto,
      owner_id: userId,
      mailSent: false,
    });
    const savedTodo = await createdTodo.save();

    // Check if deadline is within the next 1 hour for immediate reminder email
    if (savedTodo.deadline) {
      const nowMs = Date.now();
      const deadlineMs = new Date(savedTodo.deadline).getTime();
      const oneHourFromNowMs = nowMs + 60 * 60 * 1000;

      if (!isNaN(deadlineMs) && deadlineMs >= nowMs && deadlineMs <= oneHourFromNowMs) {
        try {
          const owner = await this.usersService.findById(userId);
          if (owner && owner.email) {
            const success = await this.mailService.sendReminderEmail(
              owner.email,
              savedTodo.title,
              savedTodo.description,
              savedTodo.deadline,
            );
            if (success) {
              savedTodo.mailSent = true;
              await savedTodo.save();
            }
          }
        } catch (err: any) {
          this.logger.error(
            `Immediate reminder email failed for todo ${savedTodo._id}: ${err?.message || err}`,
          );
        }
      }
    }

    return savedTodo;
  }

  /**
   * Update an existing Todo ensuring user ownership
   */
  async update(id: string, updateTodoDto: UpdateTodoDto, userId: string): Promise<TodoDocument> {
    await this.findOneForUser(id, userId);

    const updatedTodo = await this.todoModel.findByIdAndUpdate(
      id,
      { $set: updateTodoDto },
      { new: true },
    );

    if (!updatedTodo) {
      throw new NotFoundException('Todo not found');
    }

    return updatedTodo;
  }

  /**
   * Delete a Todo ensuring user ownership
   */
  async remove(id: string, userId: string): Promise<void> {
    await this.findOneForUser(id, userId);
    await this.todoModel.findByIdAndDelete(id);
  }
}
