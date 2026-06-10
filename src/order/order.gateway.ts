import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
@WebSocketGateway()
export class OrderGateway {
  handleConnection(@ConnectedSocket() client: Socket) {
    ///write your command
    console.log('Client connected:', client.id);
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): string {
    console.log('Received message from client:', payload);
    return 'Hello world!';
  }
}
