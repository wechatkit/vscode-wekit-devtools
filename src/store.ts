import { deepClone } from "./tools/deepClone";
import * as vscode from "vscode";
import { createWebview } from "./createWebview";
import path = require("path");
import { WekitServer } from "./libs/WekitServer";
import { Socket } from "net";
import { formatIpv4 } from "./formatIpv4";

type EventLog = {
  entryType: string;
  name: string;
  startTime: number;
  duration: number;
  data: any;
};

export class EventModel {
  snapId: string = new Date().toLocaleString();
  pageMap: Map<string, EventLog[]> = new Map();
}

export class DeviceModel {
  panel: vscode.WebviewPanel | undefined;

  eventModel = new EventModel();
  eventModelSnap: EventModel[] = [this.eventModel];

  constructor(public ip: string, public deviceStore: DeviceStore) {}

  activeWebview() {
    const ip = this.ip;
    const context = this.deviceStore.context;
    if (this.panel) {
      const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;
      this.panel.reveal(columnToShowIn);
    } else {
      this.panel = createWebview(
        path.join(context.extensionPath, "webview", "main-panel", "dist"),
        ip, // 只供内部使用，这个webview的标识
        `${ip}/事件` // 给用户显示的面板标题
      );
      const fn = (data: any) => {
        this.postMessage("pushSnapPage", {
          snapId: this.eventModel.snapId,
          page: data.page,
          entry: data.entry,
        });
      };
      this.deviceStore.server.eventHub.on("DeviceModel:pushEventLog", fn);
      this.panel.onDidDispose(
        () => {
          // 当我们的面板被释放时执行清理
          this.panel = undefined;
          this.deviceStore.server.eventHub.off("DeviceModel:pushEventLog", fn);
        },
        null,
        context.subscriptions
      );
    }
  }

  postMessage(name: any, data: any) {
    this.panel?.webview.postMessage([name, data]);
  }

  pushEventLog(page: string, entry: EventLog) {
    const eventLogs = this.eventModel.pageMap.get(page) || [];
    if (!this.eventModel.pageMap.has(page)) {
      this.eventModel.pageMap.set(page, eventLogs);
    }
    eventLogs.push(entry);
    this.deviceStore.server.eventHub.emit("DeviceModel:pushEventLog", {
      page,
      entry,
    });
  }

  clearPageEvent(page: string) {
    this.eventModel.pageMap.set(page, []);
    this.postMessage("postSnapPage", {
      snapId: this.eventModel.snapId,
      page,
      entries: [],
    });
  }

  snapEventStore() {
    this.eventModel = new EventModel();
    this.eventModelSnap.push(this.eventModel);
  }

  getSnapList() {
    return this.eventModelSnap;
  }
}

export class DeviceStore {
  deviceMap: Map<string, DeviceModel> = new Map();

  constructor(
    public server: WekitServer,
    public context: vscode.ExtensionContext
  ) {
    DeviceStore.instance = this;

    server.eventHub.on("SidlerTreeDataProvider:eventEntry", (data: any) => {
      const device = this.deviceMap.get(data.ip);
      if (device) {
        device.activeWebview();
        console.log("device", device);

        device.getSnapList().forEach((item: EventModel) => {
          device.postMessage("postSnap", {
            snapId: item.snapId,
            pageMap: Array.from(item.pageMap.entries()),
          });
        });
      }
    });
  }

  getDevice(socket: Socket) {
    const ip = formatIpv4(socket.remoteAddress);
    const device = this.deviceMap.get(ip) || new DeviceModel(ip, this);
    if (!this.deviceMap.has(ip)) {
      this.deviceMap.set(ip, device);
    }
    return device;
  }

  static instance: DeviceStore;
}
