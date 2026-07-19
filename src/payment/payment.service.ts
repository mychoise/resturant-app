import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from '../drizzle/schema/schema';
import { and, eq, lte, sql } from 'drizzle-orm';
import { gte } from 'drizzle-orm';
import { paymentFilter } from './dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}
  async createPayment(
    table_id: string,
    order_id: string,
    payment_type: 'cash' | 'online',
  ) {
    try {
      const [orderCheck] = await this.db
        .select({
          status: schema.order.status,
        })
        .from(schema.order)
        .where(eq(schema.order.id, order_id));

      if (orderCheck.status !== 'served') {
        throw new BadRequestException(
          'Order is not served yet. Payment can only be created for served orders.',
        );
      }

      return await this.db.transaction(async (tx) => {
        await tx
          .update(schema.diningTable)
          .set({ is_occupied: false })
          .where(eq(schema.diningTable.id, table_id));

        const [order] = await tx
          .update(schema.order)
          .set({ closed_at: new Date() })
          .where(eq(schema.order.id, order_id))
          .returning();

        await tx.insert(schema.payment).values({
          order_group_id: order.id,
          total_price: order.total_price,
          payment_type: payment_type,
        });

        return { success: true, message: 'Payment created successfully' };
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async PaymentStats() {
    const [result] = await this.db
      .select({
        totalPayment: sql<number>`count(*)`,
        totalRevenue: sql<number>`coalesce(sum(${schema.payment.total_price}), 0)`,
        totalCash: sql<number>`
            coalesce(sum(case
              when ${schema.payment.payment_type} = 'cash'
              then ${schema.payment.total_price}
              else 0
            end), 0)
          `,
        totalOnline: sql<number>`
            coalesce(sum(case
              when ${schema.payment.payment_type} = 'online'
              then ${schema.payment.total_price}
              else 0
            end), 0)
          `,
      })
      .from(schema.payment);

    return result;
  }

  async viewAllPayment(data: paymentFilter) {
    const limit = 10;
    const condn: any = [];
    if (data.paymentType)
      condn.push(eq(schema.payment.payment_type, data.paymentType));
    if (data.date) {
      const currentTime = new Date(data.date);
      const endTime = new Date(currentTime);
      endTime.setDate(endTime.getDate() + 1);
      condn.push(
        and(
          gte(schema.payment.created_at, currentTime),
          lte(schema.payment.created_at, endTime),
        ),
      );
    }

    const allPayment = await this.db
      .select()
      .from(schema.payment)
      .where(and(...condn))
      .limit(limit)
      .offset(data.page ? (data.page - 1) * limit : 0);

    console.log('all payment are ', allPayment);
    return {
      msg: 'payment success',
      data: allPayment,
    };
  }
}
