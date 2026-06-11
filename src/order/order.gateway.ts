import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class OrderGateway {
  userMap = new Map<string, string>();

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(@ConnectedSocket() client: Socket) {
    const token = client.handshake?.query?.token as string;
    if (!token) {
      console.log('No token provided, disconnecting client:', client.id);
      client.disconnect();
      return;
    }
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
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.userMap.delete(client.data.userId);
    console.log('Client disconnected:', client.id);
    console.log('Current user map:', this.userMap);
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): string {
    return 'Hello world!';
  }
}
