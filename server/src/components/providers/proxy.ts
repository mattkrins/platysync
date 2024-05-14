import { xError } from "../../modules/common.js";
import { base_provider, base_provider_options } from "./base.js";
import { Hash, decrypt } from "../../modules/cryptography.js";
import { ConnectorX, Connectors, Schema } from "../models.js";
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';

export interface proxy_options extends base_provider_options {
    schema: Schema;
    url?: URL|string;
    username?: string;
    password?: string|Hash;
}

export default class PROXY extends base_provider {
    private schema: Schema;
    public url: URL|string;
    constructor(options: proxy_options) {
        super(options);
        this.schema = options.schema;
        this.url = options.url as string;
    }
    async validate(temp = false): Promise<true> {
        if (!this.schema) throw new xError('Schema can not be empty.');
        if (!this.url) throw new xError('URL can not be empty.', 'url');
        if (!temp) await this.configure();
        const response = await axios.get('https://www.example.com/', {
            httpAgent: new HttpProxyAgent(this.url),
            httpsAgent: new HttpsProxyAgent(this.url),
            proxy: false as const
        });
        if (!response || !response.data) throw new xError('No data returned.');
        if (!response.data.includes("Example Domain")) throw new xError('Unexpected malformed data.');
        return true;
    }
    public async configure(): Promise<URL> {
        const connectors = new Connectors(this.schema.name);
        const connector = connectors.get(this.name) as ConnectorX;
        const url = new URL(connector.url as string);
        if (connector.username) url.username = connector.username as string;
        if (connector.password) url.password = await decrypt(connector.password as Hash);
        this.url = url;
        return url;
    }
}