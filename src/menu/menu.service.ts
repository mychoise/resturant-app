import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from '../drizzle/schema/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';

@Injectable()
export class MenuService {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}

  async getAllMenu() {
    const categoryMap = new Map<string, any>();
    const result = await this.db
      .select()
      .from(schema.menu_item)
      .innerJoin(
        schema.menu_category,
        eq(schema.menu_category.id, schema.menu_item.category_id),
      );

    result.map((item) => {
      if (!categoryMap.has(item.menu_category.name)) {
        const value = {
          id: item.menu_category.id,
          name: item.menu_category.name,
        };
        categoryMap.set(item.menu_category.name, value);
      }
    });

    const value = result.map((item) => {
      return item.menu_item;
    });

    console.log('value', value);

    console.log('category', categoryMap);

    return {
      success: true,
      category: Array.from(categoryMap.values()),
      data: value,
    };
  }
}
