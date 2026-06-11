import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from '../drizzle/schema/schema';
import { inArray } from 'drizzle-orm';
import { CreateOrderDto } from './dto/createorder.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class OrderService {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}

  async createOrder(orderData: CreateOrderDto, userId: string) {
    const menu = await this.db
      .select()
      .from(schema.menu_item)
      .where(
        inArray(
          schema.menu_item.id,
          orderData.items.map((item) => item.menu_item_id),
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
    menu.forEach((item) => menuMap.set(item.id, item));

    return await this.db.transaction(async (tx) => {
      const [orderGroup] = await tx
        .insert(schema.order)
        .values({
          table_id: orderData.table_id,
        })
        .returning();
      let totalPrice = 0;
      for (const item of orderData.items) {
        const menuItem = menuMap.get(item.menu_item_id);
        const [orderItem] = await tx
          .insert(schema.order_item)
          .values({
            order_taken_by: userId,
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
  async changeStatus(
    order_id: string,
    order_item_id: string,
    status: 'pending' | 'preparing' | 'ready' | 'served',
  ) {
    try {
      let neededStatus: 'pending' | 'preparing' | 'ready' | 'served' =
        'pending';
      const [updatedItem] = await this.db
        .update(schema.order_item)
        .set({
          status,
        })
        .where(eq(schema.order_item.id, order_item_id))
        .returning();

      const allItems = await this.db
        .select()
        .from(schema.order_item)
        .where(eq(schema.order_item.order_id, order_id));

      if (allItems.every((item) => item.status === 'served')) {
        neededStatus = 'served';
      } else if (allItems.every((item) => item.status === 'ready')) {
        neededStatus = 'ready';
      } else if (allItems.every((item) => item.status === 'preparing')) {
        neededStatus = 'preparing';
      } else {
        neededStatus = 'pending';
      }

      await this.db
        .update(schema.order)
        .set({
          status: neededStatus,
        })
        .where(eq(schema.order.id, order_id));

      return {
        success: true,
        message: `Order item status updated to ${status}`,
        data: updatedItem,
      };
    } catch (error) {
      console.log('error in changeStatus', error);
    }
  }

  //   async addInPreviousOrder(
  //     orderData: CreateOrderDto,
  //     userId: string,
  //     order_id: string,
  //   ) {
  //     const menu = await this.db
  //       .select()
  //       .from(schema.menu_item)
  //       .where(
  //         inArray(
  //           schema.menu_item.id,
  //           orderData.items.map((item) => item.menu_item_id),
  //         ),
  //       );

  //     for (const item of menu) {
  //       if (!item.is_available) {
  //         throw new NotFoundException(
  //           `Menu item with ID ${item.id} is not availableat the moment`,
  //         );
  //       }
  //     }
  //     const menuMap = new Map<string, (typeof menu)[0]>();
  //     menu.forEach((item) => menuMap.set(item.id, item));

  //     let totalPrice = 0;

  //     for (const item of orderData.items) {
  //       const menuItem = menuMap.get(item.menu_item_id);
  //       const [orderItem] = await this.db
  //         .insert(schema.order_item)
  //         .values({
  //           order_taken_by: userId,
  //           order_id: order_id,
  //           menu_item_id: item.menu_item_id,
  //           item_name: menuItem?.name || 'Unknown Item',
  //           price_snapshot: parseInt(menuItem?.price || '0', 10),
  //           quantity: item.quantity,
  //           subtotal: parseInt(menuItem?.price || '0', 10) * item.quantity,
  //         })
  //         .returning();
  //       totalPrice += orderItem.subtotal;

  //       await this.db
  //         .update(schema.order)
  //         .set({
  //           total_price: totalPrice,
  //         })
  //         .where(eq(schema.order.id, order_id));
  //     }
  //   }
}
