import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Todo, TodoDocument } from './schemas/todo.schema';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodosService {
  constructor(
    @InjectModel(Todo.name) private todoModel: Model<TodoDocument>,
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
    const createdTodo = new this.todoModel({
      ...createTodoDto,
      owner_id: userId,
    });
    return createdTodo.save();
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
