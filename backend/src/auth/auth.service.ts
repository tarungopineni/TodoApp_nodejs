import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user account
   */
  async register(dto: RegisterDto): Promise<{ message: string }> {
    const rawPassword = dto.hashed_password || dto.password;
    if (!rawPassword) {
      throw new BadRequestException('Password is required');
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await this.usersService.create({
      email: dto.email,
      username: dto.username,
      first_name: dto.first_name,
      last_name: dto.last_name,
      role: dto.role || 'dev',
      password: hashedPassword,
    });

    return { message: 'User created successfully' };
  }

  /**
   * Validate user credentials against stored bcrypt hash
   */
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      return user;
    }
    return null;
  }

  /**
   * Login user and issue JWT access token
   */
  async login(username: string, pass: string): Promise<{ access_token: string; token_type: string }> {
    const user = await this.validateUser(username, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'bearer',
    };
  }
}
