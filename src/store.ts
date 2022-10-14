import { deepClone } from "./tools/deepClone";

type EventLog = {
  entryType: string;
  name: string;
  startTime: number;
  duration: number;
  data: any;
};

export class Store {
  private eventLogsMap: Map<string, EventLog[]> = new Map();

  pushEventLog(page: string, eventLog: EventLog) {
    if (!this.eventLogsMap.has(page)) {
      this.eventLogsMap.set(page, []);
    }
    this.eventLogsMap.get(page)!.push(eventLog);
  }

  getEventLogs(page: string) {
    return this.eventLogsMap.get(page);
  }

  clear(page?: string) {
    if (page) {
      this.eventLogsMap.delete(page);
    } else {
      this.eventLogsMap.clear();
    }
  }

  snapshot() {
    const _clone = deepClone(this);
    Store.snapshotMap.set(new Date().toDateString(), _clone);
    return _clone;
  }

  static snapshotMap = new Map<string, Store>();

  static getSnapshotKeys() {
    return Array.from(this.snapshotMap.keys());
  }

  static diffSnapshot(source: string, target: string) {
    //TODO:
  }
}

export default new Store();
