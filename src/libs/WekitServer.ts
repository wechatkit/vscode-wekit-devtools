import { createServer, Server, Socket } from "net";
import { ip } from "address";
import EventEmitter = require("events");
import { EventCtx } from "./EventCtx";
import { Log } from "./Log";
import { StickyChunk } from "./StickyChunk";

export class WekitServer {
  tcp: Server = createServer();
  socketMap = new Map<string, Socket>();
  cl = {
    event: new EventEmitter(),
    request: new EventEmitter(),
  };
  serverEvent = new EventEmitter();
  eventHub = new EventEmitter();
  stickyChunkMap = new Map<string, StickyChunk>();

  constructor() {
    if (WekitServer.instance) {
      return WekitServer.instance;
    }
    WekitServer.instance = this;
  }

  init() {
    this.tcp.on("connection", async (socket) => {
      Log.debug("connected", socket.remoteAddress, Date.now());
      const tSocket = this.socketMap.get(socket.remoteAddress!);
      if (tSocket) {
        tSocket.destroy();
        tSocket.removeAllListeners();
        Log.debug("重复链接", socket.remoteAddress);
      }
      const stickyChunk = new StickyChunk();

      this.socketMap.set(socket.remoteAddress!, socket);
      this.serverEvent.emit("connection", socket);
      socket.on("data", (data) => {
        const msg = data.toString();
        Log.debug("data:", socket.remoteAddress, msg, Date.now());
        const msgObj = stickyChunk!.push(new Uint8Array(data.buffer));
        Log.debug(msgObj);

        for (let i = 0; i < msgObj.length; i++) {
          const msg = msgObj[i];
          const [type, name, value] = msg;
          this.cl[type as "event" | "request"].emit(name, value, socket);
        }
      });
    });

    this.cl.request.on("hello", (value, socket) => {
      this.write(socket, "request", "hello", value + 1);
    });
  }

  listen(port: number = 9191, cb: any) {
    this.init();
    this.tcp.listen(port, () => {
      let addressUrl = `${ip()}:${port}`;
      Log.log(`启动成功监听 ${addressUrl}`);
      cb(null, addressUrl);
    });
  }

  async close() {
    for (const [address, socket] of this.socketMap) {
      await this.emit(socket, "close", 1);
      Log.debug("断开链接", address);
      socket.destroy();
      socket.removeAllListeners();
    }
    this.tcp.close();
    this.tcp.removeAllListeners();
  }

  write(
    socket: Socket | string,
    type: "request" | "event",
    name: string,
    data: any
  ) {
    const address = typeof socket === "string" ? socket : socket.remoteAddress;
    if (!address) {
      console.error("socket address is null");
      return;
    }
    Log.debug("emit:", address, [type, name, data]);
    const sendMsg = StickyChunk.encode([type, name, data]);
    return new Promise((resolve, reject) => {
      this.socketMap.get(address)!.write(sendMsg, resolve);
    });
  }

  getAddressList() {
    return Array.from(this.socketMap.keys());
  }

  getSockets() {
    return Array.from(this.socketMap.values());
  }

  bindServerEvent(name: string, handler: any) {
    this.serverEvent.on(name, handler);
    return this;
  }

  send(socket: Socket | string, name: string, data: any) {
    return new Promise((resolve, reject) => {
      this.cl.request.once(name, (data) => {
        resolve(data);
      });
      this.write(socket, "request", name, data);
    });
  }

  emit(socket: Socket | string, name: string, data: any) {
    return this.write(socket, "event", name, data);
  }

  on(name: string, handler: any) {
    this.cl.event.on(name, (data, socket) => {
      handler(data, new EventCtx(socket, this));
    });
  }

  route(name: string, handler: any) {
    this.cl.request.on(name, async (data, socket) => {
      const res = await handler(data, new EventCtx(socket, this));
      this.write(socket, "request", name, res);
    });
  }

  static instance: WekitServer;
}
