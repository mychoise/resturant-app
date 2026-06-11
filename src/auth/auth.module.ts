import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './guards/access.guard';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [ConfigModule, PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtAuthGuard, JwtStrategy],
})
export class AuthModule {}
