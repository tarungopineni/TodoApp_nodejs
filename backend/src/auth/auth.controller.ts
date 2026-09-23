import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/create
   * Register a new user
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/token
   * Login with username and password, returns JWT token
   * Supports both application/x-www-form-urlencoded and application/json
   */
  @Post('token')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: Record<string, any>) {
    const username = body.username;
    const password = body.password;

    if (!username || !password) {
      throw new UnauthorizedException('Username and password are required');
    }

    return this.authService.login(username, password);
  }
}
