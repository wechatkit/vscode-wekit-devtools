// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { WekitServer } from "./libs/WekitServer";
import router from "./router";

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

  let listenCmd = vscode.commands.registerCommand(
    "vscode-wekit-devtools.listen",
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
  let stopCmd = vscode.commands.registerCommand(
    "vscode-wekit-devtools.stop",
    () => {
      server
        .close()
        .then(() => {
          vscode.window.showInformationMessage(`关闭成功`);
        })
        .catch((err) => {
          vscode.window.showErrorMessage(`关闭失败: ${err.message}`);
        });
    }
  );

  context.subscriptions.push(listenCmd);
  context.subscriptions.push(stopCmd);
}

// this method is called when your extension is deactivated
export function deactivate() {}
