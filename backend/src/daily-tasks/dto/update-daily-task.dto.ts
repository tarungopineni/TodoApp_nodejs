import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateDailyTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;
}
