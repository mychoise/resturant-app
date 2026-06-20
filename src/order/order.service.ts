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
      let insertedItem: any = [];
      for (const item of orderData.items) {
        const menuItem = menuMap.get(item.menu_item_id);

        const [orderItem] = await tx
          .insert(schema.order_item)
          .values({
            order_taken_by: userId,
            order_id: orderGroup.id,
            menu_item_id: item.menu_item_id,
            item_name: menuItem?.name || 'Unknown Item',
            price_snapshot: menuItem?.price || 0,
            quantity: item.quantity,
            subtotal: (menuItem?.price || 0) * item.quantity,
          })
          .returning();
        totalPrice += orderItem.subtotal;
        insertedItem.push(orderItem);
      }
      const [updatedOrder] = await tx
        .update(schema.order)
        .set({
          total_price: totalPrice,
        })
        .where(eq(schema.order.id, orderGroup.id))
        .returning();
      const itemNames = orderData.items
        .map((item: any) => menuMap.get(item.menu_item_id)?.name)
        .join(', ');

      return {
        order: {
          ...updatedOrder,
          items: insertedItem,
        },
        total_price: totalPrice,
        msg: `Order created successfully for ${itemNames}`,
      };
    });
  }

  async changeStatus(
    order_item_id: string,
    status: 'pending' | 'preparing' | 'ready' | 'served',
  ) {
    try {
      const [updatedItem] = await this.db
        .update(schema.order_item)
        .set({
          status,
        })
        .where(eq(schema.order_item.id, order_item_id))
        .returning();

      return {
        success: true,
        message: `Order item status updated to ${status}`,
        data: updatedItem,
      };
    } catch (error) {
      console.log('error in changeStatus', error);
    }
  }

  async addInPreviousOrder(
    orderData: CreateOrderDto,
    userId: string,
    order_id: string,
  ) {
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
          `Menu item with ID ${item.id} is not availableat the moment`,
        );
      }
    }
    const menuMap = new Map<string, (typeof menu)[0]>();
    menu.forEach((item) => menuMap.set(item.id, item));

    const [order] = await this.db
      .select()
      .from(schema.order)
      .where(eq(schema.order.id, order_id));

    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found`);
    }

    return await this.db.transaction(async (tx) => {
      let additionalPrice = 0;
      const orderItems = orderData.items.map((item) => {
        const menuItem = menuMap.get(item.menu_item_id);
        const subtotal = (menuItem?.price || 0) * item.quantity;
        additionalPrice += subtotal;
        return {
          order_id,
          order_taken_by: userId,
          menu_item_id: item.menu_item_id,
          item_name: menuItem?.name || 'Unknown Item',
          price_snapshot: menuItem?.price || 0,
          quantity: item.quantity,
          subtotal,
        };
      });
      await tx.insert(schema.order_item).values(orderItems);
      const [updatedOrder] = await tx
        .update(schema.order)
        .set({ total_price: order.total_price + additionalPrice })
        .where(eq(schema.order.id, order_id))
        .returning();
      const itemNames = orderData.items
        .map((item) => menuMap.get(item.menu_item_id)?.name)
        .join(', ');

      return {
        order: updatedOrder,
        msg: `Items added successfully: ${itemNames}`,
      };
    });
  }
}
