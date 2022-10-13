import * as vscode from "vscode";
import { WekitServer } from "./libs/WekitServer";
import { Socket } from "net";

export class SidlerTreeDataProvider
  implements vscode.TreeDataProvider<ClientItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ClientItem | undefined | void
  > = new vscode.EventEmitter<ClientItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ClientItem | undefined | void> =
    this._onDidChangeTreeData.event;

  constructor(public server: WekitServer) {
    server.bindServerEvent("connection", () => {
      this.refresh();
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
  constructor(
    public readonly socket: Socket,
    public readonly command?: vscode.Command
  ) {
    super(
      formatIpv4(socket.remoteAddress),
      vscode.TreeItemCollapsibleState.None
    );

    this.tooltip = `${socket.remoteFamily} ${socket.remoteAddress}${socket.remotePort}`;
    this.description = `[在线]`;
  }

  iconPath = "icon/wekit-logo.svg";

  contextValue = "dependency";
}

function formatIpv4(str: string | undefined) {
  if (!str) {
    return "None";
  }
  const lastF = str.lastIndexOf(":");
  return str.substring(lastF + 1);
}
