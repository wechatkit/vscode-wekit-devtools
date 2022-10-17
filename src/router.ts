import { WekitServer } from "./libs/WekitServer";
import { DeviceStore } from "./store";
import { Socket } from "net";
import { RequestCtx } from "./libs/RequestCtx";
import { EventCtx } from "./libs/EventCtx";

export default function (server: WekitServer) {
  server.route("ping", (data: number) => {
    return Date.now() - data;
  });

  server.route("getSockets", () => {
    return server.getAddressList();
  });

  server.route("pushEventLog", (data: any, requestCtx: RequestCtx) => {
    const device = DeviceStore.instance.getDevice(requestCtx.socket);
    device.pushEventLog(data.page, data.entry);
  });

  server.on("pushEventLog", (data: any, eventCtx: EventCtx) => {
    const device = DeviceStore.instance.getDevice(eventCtx.socket);
    device.pushEventLog(data.page, data.entry);
  });

  server.route("clearPageEvent", (page: string, requestCtx: RequestCtx) => {
    const device = DeviceStore.instance.getDevice(requestCtx.socket);
    device.clearPageEvent(page);
  });

  server.on("clear", (data: any, eventCtx: EventCtx) => {
    const device = DeviceStore.instance.getDevice(eventCtx.socket);
    device.clearAll();
  });
}
