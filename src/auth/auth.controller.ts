import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerDto } from './dto/register.dto';
import { loginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() data: registerDto) {
    return this.authService.register(data);
  }

  @Post('login')
  async login(@Body() data: loginDto) {
    return this.authService.login(data);
  }
}
