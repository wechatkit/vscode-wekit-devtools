import * as vscode from "vscode";
import { WekitServer } from "./libs/WekitServer";
import { Socket } from "net";
import path = require("path");
import { readFileSync } from "fs";

export class SidlerTreeDataProvider
  implements vscode.TreeDataProvider<ClientItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    ClientItem | undefined | void
  > = new vscode.EventEmitter<ClientItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<ClientItem | undefined | void> =
    this._onDidChangeTreeData.event;

  private panel: vscode.WebviewPanel | undefined;

  constructor(
    public server: WekitServer,
    public context: vscode.ExtensionContext
  ) {
    server.bindServerEvent("connection", () => {
      this.refresh();
    });

    server.eventHub.on("pushEventLog", (data: any) => {
      this.postMessage("pushEventLog", data);
    });

    vscode.window.registerTreeDataProvider("wekit-devtools", this);

    vscode.commands.registerCommand("wekit-devtools.refreshEntry", () => {
      this.refresh();
    });

    vscode.commands.registerCommand("wekit-devtools.eventEntry", (node) => {
      console.log(
        "eventEntry",
        node.label,
        this.panel?.active,
        this.panel?.visible
      );
      if (this.panel) {
        const columnToShowIn = vscode.window.activeTextEditor
          ? vscode.window.activeTextEditor.viewColumn
          : undefined;
        this.panel.reveal(columnToShowIn);
      } else {
        this.panel = createWebview(
          path.join(context.extensionPath, "webview", "main-panel", "dist"),
          node.label, // 只供内部使用，这个webview的标识
          `${node.label}/性能` // 给用户显示的面板标题
        );
        this.panel.onDidDispose(
          () => {
            // 当我们的面板被释放时执行清理
            this.panel = undefined;
          },
          null,
          context.subscriptions
        );
      }
    });
  }

  postMessage(name: any, data: any) {
    this.panel?.webview.postMessage([name, data]);
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

function createWebview(rootString: string, viewType: string, title: string) {
  const localResourceRoots = vscode.Uri.file(path.join(rootString, "/"));
  const vscodeRootUrl = localResourceRoots.with({
    scheme: "vscode-resource",
  });
  const panel = vscode.window.createWebviewPanel(
    viewType,
    title,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [localResourceRoots],
      enableCommandUris: true,
    }
  );
  const pagePath = path.join(rootString, "index.html");
  let html = readFileSync(pagePath, "utf-8");
  html = html.replace(
    '<base href="./" />',
    `<base href="${vscodeRootUrl.toString()}" >`
  );
  panel.webview.html = html;
  return panel;
}
