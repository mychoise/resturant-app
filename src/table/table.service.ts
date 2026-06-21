import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from '../drizzle/schema/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class TableService {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}
  async getAllTables() {
    const tables = await this.db.select().from(schema.diningTable);
    return tables;
  }
  async changeStatus(tableId: string, is_occupied: boolean) {
    const [updatedTable] = await this.db
      .update(schema.diningTable)
      .set({ is_occupied })
      .where(eq(schema.diningTable.id, tableId))
      .returning();

    return updatedTable;
  }
}
