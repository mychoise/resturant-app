import { Inject, Injectable } from '@nestjs/common';
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
      throw new Error('User with this email already exists');
    }
    const hashedPassword = await this.hashPassword(data.password);
    const accessToken = this.generateAccessToken(
      data.email,
      data.role,
      data.name,
    );

    const [addedUser] = await this.db
      .insert(schema.users)
      .values({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      })
      .returning();

    return {
      msg: 'User created successfully',
      user: addedUser,
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

    const accessToken = this.generateAccessToken(
      user.email,
      user.role,
      user.name,
    );

    return {
      msg: 'Login successful',
      user,
      token: accessToken,
    };
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(
      password,
      this.configService.get<number>('SALT_ROUNDS')!,
    );
  }
  generateAccessToken(email: string, role: string, name: string): string {
    const payload = { email, role, name };
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
