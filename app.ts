// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   MessageBody,
//   ConnectedSocket,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
// } from '@nestjs/websockets';
// import { UsePipes, ValidationPipe } from '@nestjs/common';
// import { Server, Socket } from 'socket.io';
// import { JwtService } from '@nestjs/jwt';

// @UsePipes(new ValidationPipe())
// @WebSocketGateway({ cors: { origin: '*' } })
// export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer()
//   server: Server;

//   private connectedUsers = new Map<string, string>(); // userId -> socketId

//   constructor(
//     private orderService: OrderService,

//     private jwtService: JwtService,
//   ) {}

//   // ─── connection ───────────────────────────────────

//   handleConnection(client: Socket) {
//     const token = client.handshake.auth?.token;

//     try {
//       const payload = this.jwtService.verify(token, {
//         secret: process.env.JWT_ACCESS_SECRET,
//       });

//       client.data.userId = payload.sub;

//       client.data.role = payload.role;

//       // store in map

//       this.connectedUsers.set(payload.sub, client.id);

//       // auto join role room

//       if (payload.role === 'kitchen') client.join('kitchen');

//       if (payload.role === 'waiter') client.join('waiters');
//     } catch {
//       client.disconnect();
//     }
//   }

//   handleDisconnect(client: Socket) {
//     this.connectedUsers.delete(client.data.userId);

//     console.log('disconnected:', client.id);
//   }

//   // ─── join table room ──────────────────────────────

//   @SubscribeMessage('join:table')
//   handleJoinTable(
//     @MessageBody() tableId: string,
//     @ConnectedSocket() client: Socket,
//   ) {
//     client.join(`table:${tableId}`);
//     client.emit('joined', `table:${tableId}`);
//   }
//   // ─── waiter places order ──────────────────────────
//   @SubscribeMessage('order:new')
//   async handleNewOrder(
//     @MessageBody() dto: NewOrderDto,
//     @ConnectedSocket() client: Socket,
//   ) {
//     // delegate to service
//     const order = await this.orderService.createOrder(dto, client.data.userId);
//     // notify kitchen
//     this.server.to('kitchen').emit('order:new', order);
//     // notify table
//     this.server.to(`table:${dto.tableId}`).emit('order:new', order);
//     // confirm to waiter
//     client.emit('order:created', order);
//   }

//   // ─── kitchen updates status ───────────────────────

//   @SubscribeMessage('order:status')
//   async handleStatusUpdate(@MessageBody() dto: UpdateStatusDto) {
//     const order = await this.orderService.updateStatus(dto.orderId, dto.status);

//     // notify table

//     this.server.to(`table:${dto.tableId}`).emit('order:status', order);

//     // notify all waiters

//     this.server.to('waiters').emit('order:status', order);
//   }

//   // ─── waiter marks served ──────────────────────────
// //
//   @SubscribeMessage('order:served')
//   async handleOrderServed(@MessageBody() dto: UpdateStatusDto) {
//     const order = await this.orderService.updateStatus(dto.orderId, 'served');

//     this.server.to(`table:${dto.tableId}`).emit('order:served', order);

//     this.server.to('kitchen').emit('order:served', order);
//   }

//   // ─── mark payment ─────────────────────────────────

//   @SubscribeMessage('order:paid')
//   async handleOrderPaid(
//     @MessageBody()
//     dto: {
//       orderId: string;
//       tableId: string;
//       paymentMethod: string;
//     },
//   ) {
//     const order = await this.orderService.markPaid(
//       dto.orderId,
//       dto.paymentMethod,
//     );

//     this.server.to(`table:${dto.tableId}`).emit('order:paid', order);

//     this.server.to('waiters').emit('order:paid', order);
//   }
// }
