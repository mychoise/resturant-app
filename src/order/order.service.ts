import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from '../drizzle/schema/schema';
import { inArray, lt } from 'drizzle-orm';
import {
  CreateOrderDto,
  CreateOrderItemDto,
  FilterOrderDto,
} from './dto/createorder.dto';
import { eq, gte, and } from 'drizzle-orm';
import { TableService } from 'src/table/table.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { desc } from 'drizzle-orm';
// import { OrderProcessor } from './order.processor';

@Injectable()
export class OrderService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private readonly tableService: TableService,
    @InjectQueue('send-alert') private orderQueue: Queue,
  ) {}

  async createOrder(orderData: CreateOrderDto, userId: string) {
    try {
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
        // console.log('Table status updated:', table);
        const [orderGroup] = await tx
          .insert(schema.order)
          .values({
            table_id: orderData.table_id,
            // table_number: table.table_number,
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

        const scheduler = await this.orderQueue.upsertJobScheduler(
          `alert-${orderGroup.id}`, // unique per order
          { every: 60 * 1000 }, // every 1 minute
          {
            name: 'provide:alert',
            data: {
              orderId: orderGroup.id,
              tableNumber: table.table_number,
            },
          },
        );

        console.log('scheduled task with', scheduler);

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
    } catch (error) {
      console.log('error in createOrder', error);
    }
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

      console.log('item staus succesfully updated to', updatedItem.status);

      const result = await this.db
        .select()
        .from(schema.order_item)
        .innerJoin(
          schema.order,
          eq(schema.order.id, schema.order_item.order_id),
        )
        .innerJoin(
          schema.diningTable,
          eq(schema.order.table_id, schema.diningTable.id),
        )
        .where(eq(schema.order_item.order_id, updatedItem.order_id));
      console.log('data udgsdiu', result);
      const table = result[0].diningTable.table_number;

      const statusPriority = (s) => {
        if (s === 'pending') return 0;
        if (s === 'preparing') return 1;
        if (s === 'ready') return 2;
        if (s === 'served') return 3;
        return 4;
      };

      const overallStatus = result.reduce((lowest, row) => {
        return statusPriority(row['order-item'].status) < statusPriority(lowest)
          ? row['order-item'].status
          : lowest;
      }, result[0]['order-item'].status);

      console.log('Overall order status:', overallStatus);

      await this.db
        .update(schema.order)
        .set({ status: overallStatus })
        .where(eq(schema.order.id, updatedItem.order_id));

      return {
        success: true,
        message: `Order item status updated to ${status}`,
        updatedItem: {
          ...updatedItem,
          table,
        },
      };
    } catch (error) {
      console.log('error in changeStatus', error);
    }
  }

  async addInPreviousOrder(
    orderData: CreateOrderItemDto[],
    userId: string,
    order_id: string,
  ) {
    console.log('data received from frontend is ', orderData);
    const menu = await this.db
      .select()
      .from(schema.menu_item)
      .where(
        inArray(
          schema.menu_item.id,
          orderData.map((item) => item.menu_item_id),
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
      .where(eq(schema.order.id, order_id))
      .innerJoin(
        schema.diningTable,
        eq(schema.order.table_id, schema.diningTable.id),
      );

    if (!order) {
      throw new NotFoundException(`Order with ID ${order_id} not found`);
    }

    console.log('fucking iduidgufiweuif order found', order);

    return await this.db.transaction(async (tx) => {
      let additionalPrice = 0;
      console.log('orderData is', orderData);
      const orderItems = orderData?.map((item) => {
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
      const insertedItem = await tx
        .insert(schema.order_item)
        .values(orderItems)
        .returning();

      const [updatedOrder] = await tx
        .update(schema.order)
        .set({
          total_price: order.order.total_price + additionalPrice,
          status: 'pending',
        })
        .where(eq(schema.order.id, order_id))
        .returning();
      const itemNames = orderData
        .map((item) => menuMap.get(item.menu_item_id)?.name)
        .join(', ');

      const scheduler = await this.orderQueue.upsertJobScheduler(
        `alert-${order.order.id}`, // unique per order
        { every: 60 * 1000 }, // every 1 minute
        {
          name: 'provide:alert',
          data: {
            orderId: order.order.id,
            tableNumber: order.diningTable.table_number,
          },
        },
      );

      console.log('scheduled task with', scheduler);

      return {
        order: {
          ...updatedOrder,
          items: insertedItem,
        },
        table: order.diningTable,
        msg: `Items added successfully: ${itemNames}`,
      };
    });
  }

  async getAllOrderById(table_id: string) {
    try {
      console.log(
        '=================================================================================================================',
      );
      console.log('Table id received', table_id);
      const [order] = await this.db
        .select()
        .from(schema.order)
        .where(eq(schema.order.table_id, table_id))
        .orderBy(desc(schema.order.ordered_at));
      console.log('order found', order);

      const orderedItem = await this.db
        .select()
        .from(schema.order_item)
        .where(eq(schema.order_item.order_id, order.id));

      console.log('ordered items are', orderedItem);

      return {
        order,
        orderedItem,
      };
    } catch (error) {
      console.log('error in getAllOrderById', error);
      throw new Error();
    }

    // const orderDetails = await this.db
    //   .select()
    //   .from(schema.order_item)
    //   .where(eq(schema.order_item.order_id, order.id));
    // return orderDetails;
  }

  async getAllOrders() {
    const allorder = await this.db
      .select()
      .from(schema.order)
      .innerJoin(
        schema.order_item,
        eq(schema.order.id, schema.order_item.order_id),
      )
      .innerJoin(
        schema.diningTable,
        eq(schema.order.table_id, schema.diningTable.id),
      )
      .where(
        gte(schema.order.ordered_at, new Date(Date.now() - 8 * 60 * 60 * 1000)),
      );

    const ordersMap = new Map<string, any>();
    for (const row of allorder) {
      const orderRow = row.order;
      const itemRow = row['order-item'];
      const tableRow = row.diningTable; // ✅ add this

      if (!ordersMap.has(orderRow.id)) {
        ordersMap.set(orderRow.id, {
          ...orderRow,
          table_number: tableRow.table_number, // ✅ add this
          items: [],
        });
      }
      ordersMap.get(orderRow.id).items.push(itemRow);
    }

    return { orders: Array.from(ordersMap.values()) };
  }

  async adminGetAllOrder(data: FilterOrderDto) {
    const limit = 10;
    const condn: any = [];

    if (data.date) {
      const startDay = new Date(data.date);
      const endDay = new Date(startDay);
      endDay.setDate(endDay.getDate() + 1);
      condn.push(
        and(
          gte(schema.order.ordered_at, startDay),
          lt(schema.order.ordered_at, endDay),
        ),
      );
    }
    if (data.status) condn.push(eq(schema.order.status, data.status));
    if (data.table_id) condn.push(eq(schema.order.table_id, data.table_id));

    const returned = await this.db
      .select()
      .from(schema.order)
      .where(and(...condn))
      .limit(limit)
      .offset(data.page ? (data.page - 1) * limit : 0)
      .orderBy(desc(schema.order.ordered_at));

    console.log('returned data is', returned);

    return {
      msg: 'h',
      data: returned,
    };
  }
}
