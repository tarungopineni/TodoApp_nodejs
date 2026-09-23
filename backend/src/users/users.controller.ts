import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /user/ or /user
   * Returns current authenticated user information
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getProfile(@Req() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    return user.toJSON();
  }
}
