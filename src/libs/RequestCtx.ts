import EventEmitter = require("events");
import { Socket } from "net";

export class RequestCtx {
  constructor(public socket: Socket, public event: EventEmitter) {}
}
