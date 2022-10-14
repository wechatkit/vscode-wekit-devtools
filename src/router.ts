import { WekitServer } from "./libs/WekitServer";
import store from "./store";

export default function (server: WekitServer) {
  server.route("ping", (data: number) => {
    return Date.now() - data;
  });

  server.route("getSockets", () => {
    return server.getAddressList();
  });

  server.route("pushEventLog", (data: any) => {
    server.eventHub.emit("pushEventLog", data);
  });
}
