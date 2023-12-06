import * as fs from 'fs';
import Papa from 'papaparse';
export class CSV {
    constructor(path, encoding) {
        Object.defineProperty(this, "path", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "encoding", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'utf8'
        });
        this.path = path;
        this.encoding = encoding || 'utf8';
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    open() {
        return new Promise((resolve, reject) => {
            try {
                const file = fs.createReadStream(this.path, this.encoding);
                Papa.parse(file, {
                    header: true,
                    complete: resolve,
                    error: reject
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
