import { validStr, xError } from "../../modules/common.js";
import { base_provider, base_provider_options } from "./base.js";
import { Hash, decrypt } from "../../modules/cryptography.js";
import { Schema } from "../models.js";
import PROXY from "./proxy.js";
import axios, { AxiosInstance } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

export interface api_options extends base_provider_options {
    endpoint: string;
    auth: string;
    password?: string|Hash;
    append?: string;
    proxy?: string;
    test?: string;
    schema: Schema;
}

export default class API extends base_provider {
    public endpoint: string;
    private auth: string;
    public password?: string|Hash;
    public append?: string;
    private proxy?: string|PROXY;
    private test?: string;
    private schema: Schema;
    private client: AxiosInstance = axios;
    constructor(options: api_options) {
        super(options);
        this.endpoint = options.endpoint;
        this.auth = options.auth;
        this.password = options.password;
        this.append = options.append;
        if (validStr(options.proxy)) this.proxy = options.proxy;
        this.test = options.test;
        this.schema = options.schema;
    }
    public async validate(): Promise<true> {
        if (!this.endpoint) throw new xError('Schema can not be empty.', 'schema');
        if (!this.auth) throw new xError('Authentication can not be empty.', 'school');
        await this.configure();
        if (this.test) await this.client.get(`${this.test}${this.append}`);
        return true;
    }
    public async configure(): Promise<AxiosInstance> {
        if (this.proxy){
            this.proxy = new PROXY({ schema: this.schema, name: this.proxy as string, id: '' })
            await this.proxy.configure();
        }
        if (this.auth!=="none" && typeof this.password !== "string") this.password = await decrypt(this.password as Hash);
        if (this.auth==="basic") this.password = Buffer.from(this.password as string).toString('base64');
        this.client = axios.create({
            baseURL: this.endpoint,
            httpsAgent: this.proxy ? new HttpsProxyAgent((this.proxy as PROXY).url) : false,
            proxy: false,
            headers: { Authorization:
                this.auth==="basic" ? `Basic ${this.password}` :
                this.auth==="bearer" ? `Bearer ${this.password}` : undefined
            },
        });
        return this.client;
    }
}