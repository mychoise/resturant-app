import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { login, register } from './interface/auth.interface';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/drizzle/schema/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: register) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, data.email));

    if (user) {
      throw new ConflictException('User with this email already exists'); // ✅ 409
    }
    const hashedPassword = await this.hashPassword(data.password);

    const [addedUser] = await this.db
      .insert(schema.users)
      .values({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      })
      .returning();

    const accessToken = this.generateAccessToken(addedUser);

    return {
      msg: 'User created successfully',
      user: {
        email: addedUser.email,
        name: addedUser.name,
        role: addedUser.role,
      },
      token: accessToken,
    };
  }

  async login(data: login) {
    console.log('Attempting login for email:', data.email);
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, data.email));

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.comparePassword(
      data.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user);

    return {
      msg: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token: accessToken,
    };
  }

  async removeUser(email: string) {
    const [removedUser] = await this.db
      .delete(schema.users)
      .where(eq(schema.users.email, email))
      .returning();

    if (!removedUser) {
      throw new NotFoundException('User not found');
    }

    return {
      msg: 'User deleted successfully',
      data: removedUser,
    };
  }

  async updateUser(email: string, data: any) {
    const [updatedUser] = await this.db
      .update(schema.users)
      .set(data)
      .where(eq(schema.users.email, email))
      .returning();
    console.log('user updated', updatedUser);

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return {
      msg: 'User updated successfully',
    };
  }

  async validateUser(email: string) {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;

    return result;
  }

  async updatePassword(email: string, newPassword: string) {
    const hashedPassword = await this.hashPassword(newPassword);

    const [updatedUser] = await this.db
      .update(schema.users)
      .set({ password: hashedPassword })
      .where(eq(schema.users.email, email))
      .returning();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return {
      msg: 'Password updated successfully',
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(this.configService.get<string>('SALT_ROUNDS')!);
    return await bcrypt.hash(password, saltRounds);
  }

  async getUserStats() {
    const users = await this.db.select().from(schema.users);
    const allUsers = users.length;
    const activUser = users.filter((user) => user.is_active === true).length;
    const newHires = users.filter(
      (user) =>
        user.created_at! >=
        new Date(new Date().setDate(new Date().getDate() - 30)),
    ).length;

    return {
      allUsers,
      activUser,
      newHires,
    };
  }

  generateAccessToken(user: schema.User): string {
    console.log('Generating access token for user:', user);
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET')!,
      expiresIn: '8h',
    });
  }
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}
