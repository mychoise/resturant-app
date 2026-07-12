import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { AddMenu } from './dto/menu.dto';
import { JwtAuthGuard } from 'src/auth/guards/access.guard';
import { Role } from 'src/auth/dto/register.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('menu')
export class MenuController {
  constructor(readonly menuService: MenuService) {}

  @Get('all')
  async getAllMenu() {
    return await this.menuService.getAllMenu();
  }

  @Post('add')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.ADMIN)
  async addMenu(@Body() body: AddMenu) {
    return await this.menuService.addMenuItem(body);
  }
}
