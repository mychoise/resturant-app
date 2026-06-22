import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from '../drizzle/schema/schema';
import { eq } from 'drizzle-orm';
import { OrderGateway } from './order.gateway';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Processor('send-alert')
export class OrderProcessor extends WorkerHost {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private orderGateway: OrderGateway,
    @InjectQueue('send-alert') private orderQueue: Queue,
  ) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'provide:alert': {
        await this.sendAlert(job);
        break;
      }
      default: {
        console.warn('Unknown job type:', job.name);
        break;
      }
    }
  }
  private async sendAlert(job: Job) {
    const { orderId, tableNumber } = job.data;
    console.log('Sending alert for job:', job.id, 'with data:', job.data);
    const item = await this.db
      .select()
      .from(schema.order)
      .where(eq(schema.order.id, orderId));

    const isPending = item.some((order) => order.status === 'pending');
    if (isPending) {
      console.log(
        `Order item ${orderId} is still pending. Sending alert to kitchen for table ${tableNumber}.`,
      );

      this.orderGateway.server.to('kitchen').emit('order:alert', {
        orderId,
        tableNumber,
        msg: `Order is still pending. Please prepare it for table ${tableNumber}.`,
      });
    } else {
      await this.orderQueue.removeJobScheduler(`alert-${orderId}`);
      console.log(
        `Order item ${orderId} is no longer pending. Job ${job.id} removed from queue.`,
      );
    }
  }
}
