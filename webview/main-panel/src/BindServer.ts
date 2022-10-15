import { Emitter } from "./Emitter";

const vscode = acquireVsCodeApi();

export class BindServer {
  private emitter = new Emitter();

  constructor() {
    window.addEventListener("message", (res) => {
      // console.log("message", res);
      this.emitter.emit(res.data[0], res.data[1]);
    });
  }

  emit(name: string, data: any) {
    vscode.postMessage([name, data]);
  }

  on(name: string, cb: any) {
    this.emitter.on(name, cb);
  }
}
