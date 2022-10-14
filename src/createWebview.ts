import * as vscode from "vscode";
import path = require("path");
import { readFileSync } from "fs";

export function createWebview(
  rootString: string,
  viewType: string,
  title: string
) {
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
