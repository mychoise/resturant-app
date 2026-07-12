import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from '../drizzle/schema/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import type { AddMenu, UpdateMenu } from './dto/menu.dto';

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

  async addMenuItem(data: AddMenu) {
    try {
      const categoryId = data.categoryId;
      const [updatedMenu] = await this.db
        .insert(schema.menu_item)
        .values({
          category_id: categoryId,
          name: data.name,
          description: data.description,
          price: data.price,
          is_available: true,
        })
        .returning();

      return {
        msg: 'adding data sucess',
        data: updatedMenu,
      };
    } catch (error) {
      console.log('error in adding menu item', error);
      throw new InternalServerErrorException('error occured');
    }
  }

  async removeMenuItem(id: string) {
    try {
      const [removedItem] = await this.db
        .delete(schema.menu_item)
        .where(eq(schema.menu_item.id, id))
        .returning();

      if (!removedItem) {
        throw new NotFoundException('Provided item is not available');
      }

      return {
        msg: 'removed sucess',
        data: removedItem,
      };
    } catch (error) {
      console.log('error in deleting menu', error);
    }
  }

  async updateItem(id: string, data: UpdateMenu) {
    const [updatedMenuItem] = await this.db
      .update(schema.menu_item)
      .set(data)
      .returning();

    return {
      msg: 'updated sucessfully',
      data: updatedMenuItem,
    };
  }
}
