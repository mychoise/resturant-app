import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interface/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt_access') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.['token'] || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
      passReqToCallback: true,
    });
  }

  async validate(payload: any) {
    console.log('Validating JWT payload:', payload.body);
    const user = await this.authService.validateUser(payload.body.email);
    if (!user) {
      throw new BadRequestException('Invalid token');
    }
    return {
      id: payload.body.sub,
      name: payload.body.name,
      email: payload.body.email,
      role: payload.body.role,
    };
  }
}
