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

  constructor(public server: WekitServer, context: vscode.ExtensionContext) {
    server.bindServerEvent("connection", () => {
      this.refresh();
    });

    vscode.window.registerTreeDataProvider("wekit-devtools", this);

    vscode.commands.registerCommand("wekit-devtools.refreshEntry", () => {
      this.refresh();
    });

    vscode.commands.registerCommand("wekit-devtools.eventEntry", (node) => {
      console.log("eventEntry", node.label);
      const panel = vscode.window.createWebviewPanel(
        node.label, // 只供内部使用，这个webview的标识
        `Wekit:${node.label}`, // 给用户显示的面板标题
        vscode.ViewColumn.One, // 给新的webview面板一个编辑器视图
        {} // Webview选项。我们稍后会用上
      );
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
