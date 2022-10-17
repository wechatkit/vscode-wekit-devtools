import { deepClone } from "./tools/deepClone";
import * as vscode from "vscode";
import { createWebview } from "./createWebview";
import path = require("path");
import { WekitServer } from "./libs/WekitServer";
import { Socket } from "net";
import { formatIpv4 } from "./formatIpv4";
import EventEmitter = require("events");
import { Log } from "./libs/Log";

type EventLog = {
  entryType: string;
  name: string;
  startTime: number;
  duration: number;
  data: any;
};

export class EventModel {
  snapId: string = formatDate(new Date());
  pageMap: Map<string, EventLog[]> = new Map();
}

export class DeviceModel {
  panel: vscode.WebviewPanel | undefined;

  eventModel!: EventModel;
  eventModelSnap: EventModel[] = [];
  webviewEvent = new EventEmitter();

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
        path.join(context.extensionPath, "webview", "main-panel", "dist-app"),
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
      this.webviewEvent.on("DeviceModel:pushEventLog", fn);
      const didReceiveMessageFn = (data: any) => {
        Log.debug("didReceiveMessageFn", data);
        this.webviewEvent.emit(data[0], data[1]);
      };
      this.panel?.webview.onDidReceiveMessage(didReceiveMessageFn);
      this.webViewEventHandler();
      this.panel.onDidDispose(
        () => {
          // 当我们的面板被释放时执行清理
          this.webviewEvent.off("DeviceModel:pushEventLog", fn);
          this.panel = undefined;
        },
        null,
        context.subscriptions
      );
    }
  }

  webViewEventHandler() {
    this.onReceiveMessage("syncSnapPage", (data: any) => {
      const page = data.page;
      this.postMessage("postSnapPage", {
        snapId: this.eventModel.snapId,
        page,
        entries: this.eventModel.pageMap.get(page) || [],
      });
    });
  }

  postMessage(name: any, data: any) {
    this.panel?.webview.postMessage([name, data]);
  }

  onReceiveMessage(name: string, cb: any) {
    this.webviewEvent.on(name, cb);
  }

  onceReceiveMessage(name: string, cb: any) {
    this.webviewEvent.once(name, cb);
  }

  pushEventLog(page: string, entry: EventLog) {
    const eventLogs = this.eventModel.pageMap.get(page) || [];
    if (!this.eventModel.pageMap.has(page)) {
      this.eventModel.pageMap.set(page, eventLogs);
    }
    eventLogs.push(entry);
    this.webviewEvent.emit("DeviceModel:pushEventLog", {
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

  clearAll() {
    this.eventModel = new EventModel();
    this.eventModelSnap = [this.eventModel];
    this.postMessage("postSnap", {
      snapId: this.eventModel.snapId,
      pageMap: Array.from(this.eventModel.pageMap.entries()),
    });
  }

  snapEventStore() {
    if (this.eventModel?.pageMap?.size === 0) {
      // 删除
      this.eventModelSnap = this.eventModelSnap.filter(
        (item) => item.snapId !== this.eventModel.snapId
      );
    }
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

function formatDate(date: Date) {
  return `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}
