import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from 'src/auth/guards/access.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  controllers: [MenuController],
  providers: [MenuService, JwtAuthGuard, RolesGuard],
})
export class MenuModule {}
