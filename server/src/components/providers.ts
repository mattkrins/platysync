import * as fs from 'fs';
import Papa from 'papaparse';

export class CSV {
    path: string;
    encoding: BufferEncoding = 'utf8';
    constructor(path: string, encoding?: BufferEncoding) {
        this.path = path;
        this.encoding = encoding || 'utf8';
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    open(): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                const file = fs.createReadStream(this.path, this.encoding);
                Papa.parse(file, {
                    header: true,
                    complete: resolve,
                    error: reject
                });
            } catch (e) { reject(e); }
        });
    }
    
}
