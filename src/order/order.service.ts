import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from '../drizzle/schema/schema';
import { inArray } from 'drizzle-orm';
import { CreateOrderDto } from './dto/createorder.dto';
import { eq, gte } from 'drizzle-orm';
import { TableService } from 'src/table/table.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
// import { OrderProcessor } from './order.processor';

@Injectable()
export class OrderService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private readonly tableService: TableService,
    @InjectQueue('send-alert') private orderQueue: Queue,
  ) {}

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
      const table = await this.tableService.changeStatus(
        orderData.table_id,
        true,
      );
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

      await this.orderQueue.add('provide:alert', {
        orderId: orderGroup.id,
        tableNumber: table.table_number,
      });

      return {
        order: {
          ...updatedOrder,
          items: insertedItem,
        },
        total_price: totalPrice,
        table,
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

  async getAllOrders() {
    // const order = await this.db.select().from(schema.order);
    // const orderItems = await this.db.select().from(schema.order_item);

    const allorder = await this.db
      .select()
      .from(schema.order)
      .innerJoin(
        schema.order_item,
        eq(schema.order.id, schema.order_item.order_id),
      )
      .where(
        gte(schema.order.ordered_at, new Date(Date.now() - 8 * 60 * 60 * 1000)),
      );

    const ordersMap = new Map<string, any>();

    for (const row of allorder) {
      const orderRow = row.order;
      const itemRow = row['order-item'];

      if (!ordersMap.has(orderRow.id)) {
        ordersMap.set(orderRow.id, { ...orderRow, items: [] });
      }

      ordersMap.get(orderRow.id).items.push(itemRow);
    }

    return { orders: Array.from(ordersMap.values()) };
  }
}
