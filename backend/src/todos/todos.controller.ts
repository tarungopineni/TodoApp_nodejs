import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodosService } from './todos.service';

@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  /**
   * GET /todos/ or /todos
   * Returns array of Todos for authenticated user
   */
  @Get()
  async getTodos(@Req() req: any) {
    const todos = await this.todosService.findAllForUser(req.user.userId);
    return todos.map(t => t.toJSON());
  }

  /**
   * GET /todos/todo/:id
   * Get single Todo by ID
   */
  @Get('todo/:id')
  async getTodoById(@Param('id') id: string, @Req() req: any) {
    const todo = await this.todosService.findOneForUser(id, req.user.userId);
    return todo.toJSON();
  }

  /**
   * POST /todos/todos
   * Create new Todo
   */
  @Post('todos')
  @HttpCode(HttpStatus.CREATED)
  async createTodo(@Body() dto: CreateTodoDto, @Req() req: any) {
    const todo = await this.todosService.create(dto, req.user.userId);
    return {
      message: 'Todo created successfully',
      todo: todo.toJSON(),
    };
  }

  /**
   * PUT /todos/todo/:id
   * Update existing Todo
   */
  @Put('todo/:id')
  async updateTodo(
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
    @Req() req: any,
  ) {
    const todo = await this.todosService.update(id, dto, req.user.userId);
    return {
      message: 'Todo updated successfully',
      todo: todo.toJSON(),
    };
  }

  /**
   * DELETE /todos/todo/:id
   * Delete Todo by ID
   */
  @Delete('todo/:id')
  @HttpCode(HttpStatus.OK)
  async deleteTodo(@Param('id') id: string, @Req() req: any) {
    await this.todosService.remove(id, req.user.userId);
    return { message: 'Todo deleted successfully' };
  }
}
