// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { WekitServer } from "./libs/WekitServer";
import router from "./router";
import { SidlerTreeDataProvider } from "./SidlerTreeDataProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vscode-wekit-devtools" is now active!'
  );

  const server = new WekitServer();

  router(server);

  const listenCmd = vscode.commands.registerCommand(
    "wekit-devtools.listen",
    () => {
      server.listen(9191, (err: { message: string }, address: string) => {
        if (err) {
          vscode.window.showErrorMessage(`启动失败: ${err.message}`);
        } else {
          vscode.window.showInformationMessage(`监听成功: ${address}`);
        }
      });
    }
  );
  const stopCmd = vscode.commands.registerCommand("wekit-devtools.stop", () => {
    server
      .close()
      .then(() => {
        vscode.window.showInformationMessage(`关闭成功`);
      })
      .catch((err) => {
        vscode.window.showErrorMessage(`关闭失败: ${err.message}`);
      });
  });

  new SidlerTreeDataProvider(server, context);

  const pervView = vscode.window.registerWebviewViewProvider(
    "catCoding",
    new PerfViewProvider()
  );

  context.subscriptions.push(pervView);
  context.subscriptions.push(listenCmd);
  context.subscriptions.push(stopCmd);
}

// this method is called when your extension is deactivated
export function deactivate() {}

class PerfViewProvider implements vscode.WebviewViewProvider {
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    webviewView.webview.html = `<h1>hello world</h1>`;
  }
}
