import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TableService } from './table.service';
import { JwtAuthGuard } from 'src/auth/guards/access.guard';

@Controller('table')
export class TableController {
  constructor(private readonly tableService: TableService) {}
  @Get('all')
  @UseGuards(JwtAuthGuard)
  async getAllTables() {
    return await this.tableService.getAllTables();
  }
  @Post('change-status')
  @UseGuards(JwtAuthGuard)
  async changeStatus(tableId: string, is_occupied: boolean) {
    return await this.tableService.changeStatus(tableId, is_occupied);
  }
}
