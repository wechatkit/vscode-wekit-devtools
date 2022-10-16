import { TextDecoder, TextEncoder } from "util";

export class StickyChunk {
  readLen = 0;
  dataLen = 0;
  dataBuf: Uint8Array | undefined;

  push(chunk: Uint8Array) {
    const result: any[] = [];
    if (this.dataBuf) {
      const t = new Uint8Array(this.dataBuf.length + chunk.length);
      t.set(this.dataBuf, 0);
      t.set(chunk, this.dataBuf.length);
      this.dataBuf = t;
    } else {
      this.dataBuf = chunk;
    }
    while (this.dataBuf.length > 2) {
      if (this.dataLen === 0) {
        this.dataLen = (this.dataBuf[0] << 8) + this.dataBuf[1];
      }
      if (this.dataBuf.length - 2 >= this.dataLen) {
        const data = this.dataBuf.slice(2, 2 + this.dataLen);
        this.dataBuf = this.dataBuf.slice(2 + this.dataLen);
        this.dataLen = 0;
        result.push(JSON.parse(new TextDecoder().decode(data)));
      } else {
        break;
      }
    }
    return result;
  }

  static encode(data: any) {
    const str = JSON.stringify(data);
    const buffer = new TextEncoder().encode(str);
    const len = buffer.length;
    const lenBuffer = new Uint8Array(2);
    lenBuffer[0] = len >> 8;
    lenBuffer[1] = len & 0xff;
    const result = new Uint8Array(len + 2);
    result.set(lenBuffer, 0);
    result.set(buffer, 2);
    return result;
  }
}

/*
[03xxx15yyyy] [yyyyyyy] [yyyy04zzzz]

push 0
  [[xxx]]
  store:
    dataLen = 15
    readLen = 4
    dataBuf = [yyyy00000000000]

push 1
  []
  store:
    dataLen = 15
    readLen = 11
    dataBuf = [yyyyyyyyyyy0000]

push 2
  [[yyyyyyyyyyy][zzzz]]
  store:
    dataLen = 0
    readLen = 0
    dataBuf = []
*/
