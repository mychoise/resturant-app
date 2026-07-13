import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { AddMenu, UpdateMenu } from './dto/menu.dto';
import { JwtAuthGuard } from 'src/auth/guards/access.guard';
import { Role } from 'src/auth/dto/register.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('menu')
export class MenuController {
  constructor(readonly menuService: MenuService) {}

  @Get('all')
  async getAllMenu() {
    return await this.menuService.getAllMenu();
  }

  @Post('add')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async addMenu(@Body() body: AddMenu) {
    return await this.menuService.addMenuItem(body);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteMenuItem(@Param('id', ParseUUIDPipe) id: string) {
    return await this.menuService.removeMenuItem(id);
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateMenuItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateMenu,
  ) {
    return this.menuService.updateItem(id, data);
  }
}
