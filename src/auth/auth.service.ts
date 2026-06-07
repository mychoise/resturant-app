import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
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
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, data.email));

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await this.comparePassword(
      data.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user);

    return {
      msg: 'Login successful',
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token: accessToken,
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

  async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(this.configService.get<string>('SALT_ROUNDS')!);
    return await bcrypt.hash(password, saltRounds);
  }
  generateAccessToken(user: schema.User): string {
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
