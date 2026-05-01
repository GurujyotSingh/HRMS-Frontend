import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*', credentials: true } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private jwt: JwtService, private config: ConfigService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      if (!token) { client.disconnect(); return; }
      const payload = this.jwt.verify(token, { secret: this.config.get<string>('jwt.secret') });
      client.join(payload.sub);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Client automatically leaves all rooms on disconnect
  }

  sendToUser(userId: string, data: unknown) {
    this.server?.to(userId).emit('notification', data);
  }
}
