import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from '../drizzle/schema/schema';
import { eq } from 'drizzle-orm';

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
}
