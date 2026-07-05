import { Controller, Get } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(readonly menuService: MenuService) {}

  @Get('all')
  async getAllMenu() {
    return await this.menuService.getAllMenu();
  }
}
