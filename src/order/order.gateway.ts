import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { CreateOrderDto } from './dto/createorder.dto';
import { OrderService } from './order.service';
import { Server } from 'http';
import { UsePipes, ValidationPipe } from '@nestjs/common';

@UsePipes(new ValidationPipe())
@WebSocketGateway({ cors: { origin: '*' } })
export class OrderGateway {
  userMap = new Map<string, string>();
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly orderService: OrderService,
  ) {}

  handleConnection(@ConnectedSocket() client: Socket) {
    const token = client.handshake?.query?.token as string;
    if (!token) {
      console.log('No token provided, disconnecting client:', client.id);
      client.disconnect();
      return;
    }
    try {
      const verifiedToken = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      console.log('verifiedToken:', verifiedToken);

      if (!verifiedToken) {
        console.log('Invalid token, disconnecting client:', client.id);
        client.disconnect();
        return;
      }

      client.data.userId = verifiedToken.sub;
      client.data.role = verifiedToken.role;
      this.userMap.set(verifiedToken.sub, client.id);

      if (verifiedToken.role === 'waiter') client.join('waiters');
      if (verifiedToken.role === 'kitchen') client.join('kitchen');

      console.log('Client connected:', client.id);
      console.log('Current user map:', this.userMap);
      console.log('Current waiters room:', client.rooms.has('waiters'));
      console.log('Current kitchen room:', client.rooms.has('kitchen'));
    } catch (error) {
      console.log('Error during connection:', error);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.userMap.delete(client.data.userId);
    console.log('Client disconnected:', client.id);
    console.log('Current user map:', this.userMap);
  }

  @SubscribeMessage('join:table')
  handleJoinTable(
    @MessageBody() tableId: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('table id', tableId);
    console.log(
      `Client ${client.id} joining table room: table:${JSON.stringify(tableId)}`,
    );
    client.join(`table:${tableId}`);
    client.emit('joined:table', tableId);
  }

  @SubscribeMessage('order:new')
  async handleNewOrder(
    @MessageBody() dto: CreateOrderDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log('Received new order:', dto);
      console.log('From client:', client.id);
      const userId = client.data.userId;
      const order = await this.orderService.createOrder(dto, userId);
      client.to('kitchen').emit('order:new', order);
      client.to('waiters').emit('order:new', order);
      client.to(`table:${dto.table_id}`).emit('order:new', order);
      client.emit('order:created', order);
    } catch (error) {
      console.log('failed to add', error);
    }
  }

  @SubscribeMessage('order:update')
  async handleUpdateOrder(
    @MessageBody()
    data: {
      order_item_id: string;
      status: 'pending' | 'preparing' | 'ready' | 'served';
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      'Received order update for',
      data.order_item_id,
      'to status',
      data.status,
    );

    const updatedOrder = await this.orderService.changeStatus(
      data.order_item_id,
      data.status,
    );
    client.to('waiters').emit('order:update', updatedOrder);
    client.emit('order:update', updatedOrder);
  }
  @SubscribeMessage('order:served')
  async handleChangeOrderToSeved(
    @MessageBody()
    data: {
      order_item_id: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      'Received order update for',
      data.order_item_id,
      'to status',
      'served',
    );

    const updatedOrder = await this.orderService.changeStatus(
      data.order_item_id,
      'served',
    );
    client.to('waiters').emit('order:served', updatedOrder);
    client.to('kitchen').emit('order:served', updatedOrder);
    client.emit('order:served', updatedOrder);
  }

  @SubscribeMessage('order:addToPrevious')
  async handleAddToPervious(
    @MessageBody()
    data: {
      dto: CreateOrderDto;
      userId: string;
      order_id: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('added order received for', data.dto);
    const order = await this.orderService.addInPreviousOrder(
      data.dto,
      data.userId,
      data.order_id,
    );
    client.to('kitchen').emit('order:new', order);
    client.to('waiters').emit('order:new', order);
    client.to(`table:${data.dto.table_id}`).emit('order:new', order);
    client.emit('order:created', order);
  }
}
