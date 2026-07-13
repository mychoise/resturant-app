import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerDto, Role } from './dto/register.dto';
import { loginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/access.guard';
import { User } from './decorators/user.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import type { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async register(
    @Body() data: registerDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, ...result } = await this.authService.register(data);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  @Post('login')
  async login(
    @Body() data: loginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, ...result } = await this.authService.login(data);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@User() user: any) {
    console.log('User in getProfile:', user);
    return user;
  }

  @Get('waiter')
  @Roles(Role.WAITER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getwaiter(@User() user: any) {
    return user;
  }
}
