import { debug } from "../config";

export class Log {
  static log(...args: any[]) {
    console.log(...args);
  }
  static error(...args: any[]) {
    if (debug) {
      console.error(...args);
    }
  }
  static warn(...args: any[]) {
    if (debug) {
      console.warn(...args);
    }
  }
  static info(...args: any[]) {
    if (debug) {
      console.info(...args);
    }
  }
  static debug(...args: any[]) {
    if (debug) {
      console.log(...args);
    }
  }
  static trace(...args: any[]) {
    if (debug) {
      console.trace(...args);
    }
  }
}
