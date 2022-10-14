export class Emitter {
  private events = new Map<string, Set<any>>();
  constructor() {}

  on(name: string, cb: any) {
    if (!this.events.has(name)) {
      this.events.set(name, new Set());
    }
    this.events.get(name)!.add(cb);
  }

  emit(name: string, ...args: any[]) {
    if (this.events.has(name)) {
      this.events.get(name)!.forEach((cb) => {
        cb(...args);
      });
    }
  }

  off(name: string, cb: any) {
    if (this.events.has(name)) {
      this.events.get(name)!.delete(cb);
    }
  }

  once(name: string, cb: any) {
    const wrapper = (...args: any[]) => {
      cb(...args);
      this.off(name, wrapper);
    };
    this.on(name, wrapper);
  }
}
