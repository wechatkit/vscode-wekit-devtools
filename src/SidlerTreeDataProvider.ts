import * as vscode from "vscode";
import { WekitServer } from "./libs/WekitServer";
import { Socket } from "net";
import path = require("path");
import { createWebview } from "./createWebview";
import { formatIpv4 } from "./formatIpv4";
import { DeviceStore, EventModel } from "./store";

export class SidlerTreeDataProvider
  implements vscode.TreeDataProvider<ClientItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ClientItem | undefined | void
  > = new vscode.EventEmitter<ClientItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ClientItem | undefined | void> =
    this._onDidChangeTreeData.event;

  constructor(
    public server: WekitServer,
    public context: vscode.ExtensionContext
  ) {
    vscode.window.registerTreeDataProvider("wekit-devtools", this);

    vscode.commands.registerCommand("wekit-devtools.refreshEntry", () => {
      this.refresh();
    });

    vscode.commands.registerCommand("wekit-devtools.eventEntry", (node) => {
      console.log("eventEntry", node.label);
      server.eventHub.emit("SidlerTreeDataProvider:eventEntry", node);
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ClientItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ClientItem): Thenable<ClientItem[]> {
    const clients = this.server
      .getSockets()
      .map((socket) => new ClientItem(socket));
    return Promise.resolve(clients);
  }
}

export class ClientItem extends vscode.TreeItem {
  ip: string;
  constructor(
    public readonly socket: Socket,
    public readonly command?: vscode.Command
  ) {
    super(
      formatIpv4(socket.remoteAddress),
      vscode.TreeItemCollapsibleState.None
    );

    this.ip = formatIpv4(socket.remoteAddress);
    this.tooltip = `${socket.remoteFamily} ${socket.remoteAddress}${socket.remotePort}`;
    this.description = `[在线]`;
  }

  iconPath = "icon/wekit-logo.svg";

  contextValue = "dependency";
}
