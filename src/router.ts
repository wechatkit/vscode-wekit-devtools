import { WekitServer } from "./libs/WekitServer";

export default function (server: WekitServer) {
  server.route("ping", (data: number) => {
    return Date.now() - data;
  });
}
