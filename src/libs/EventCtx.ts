import { Socket } from "net";
import { WekitServer } from "./WekitServer";

export class EventCtx {
  constructor(public socket: Socket, public wekitServer: WekitServer) {}

  emit(name: string, data: any) {
    return this.wekitServer.emit(this.socket, name, data);
  }
}
