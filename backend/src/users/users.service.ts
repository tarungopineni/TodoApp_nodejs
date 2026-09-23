import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Create a new user account with duplicate username and email checks
   */
  async create(userData: Partial<User>): Promise<UserDocument> {
    // Check for existing username (case-insensitive)
    const existingUsername = await this.userModel.findOne({
      username: { $regex: new RegExp(`^${userData.username}$`, 'i') },
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    // Check for existing email (case-insensitive)
    const existingEmail = await this.userModel.findOne({
      email: { $regex: new RegExp(`^${userData.email}$`, 'i') },
    });
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  /**
   * Find a user by username for authentication (case-insensitive)
   */
  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    });
  }

  /**
   * Find user by ID for profile retrieval
   */
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
