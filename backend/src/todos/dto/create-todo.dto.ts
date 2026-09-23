import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @IsInt()
  @Min(1)
  @Max(5)
  priority: number;

  @IsBoolean()
  complete: boolean;

  @IsOptional()
  @IsString()
  task_datetime?: string | null;

  @IsOptional()
  @IsString()
  deadline?: string | null;
}
