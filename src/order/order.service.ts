/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from '../drizzle/schema/schema';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class OrderService {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}

  async createOrder(orderData: any, userId: string) {
    const menu = await this.db
      .select()
      .from(schema.menu_item)
      .where(
        inArray(
          schema.menu_item.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          orderData.items.map((item: any) => item.menu_item_id),
        ),
      );

    for (const item of menu) {
      if (!item.is_available) {
        throw new NotFoundException(
          `Menu item with ID ${item.id} is not available`,
        );
      }
    }
    const menuMap = new Map<string, (typeof menu)[0]>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    menu.forEach((item: any) => menuMap.set(item.id, item));

    return await this.db.transaction(async (tx) => {
      const [orderGroup] = await tx
        .insert(schema.order)
        .values({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          table_id: orderData.table_id,
          order_taken_by: userId,
        })
        .returning();
      let totalPrice = 0;
      for (const item of orderData.items) {
        const menuItem = menuMap.get(item.menu_item_id);
        const [orderItem] = await tx
          .insert(schema.order_item)
          .values({
            order_id: orderGroup.id,
            menu_item_id: item.menu_item_id,
            item_name: menuItem?.name || 'Unknown Item',
            price_snapshot: parseInt(menuItem?.price || '0', 10),
            quantity: item.quantity,
            subtotal: parseInt(menuItem?.price || '0', 10) * item.quantity,
          })
          .returning();
        totalPrice += orderItem.subtotal;
      }
      return { ...orderGroup, total_price: totalPrice };
    });
  }
}
