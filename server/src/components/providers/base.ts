/* eslint-disable @typescript-eslint/no-unused-vars */
import { Hash } from "../../modules/cryptography.js";

export interface base_provider_options {
    id: string;
    name: string;
    password?: string|Hash;
    [name: string]: unknown;
}

export class base_provider implements base_provider_options {
    id: string;
    name: string;
    [k: string]: unknown;
    constructor(options: base_provider_options) {
        this.id = options.id;
        this.name = options.name;
    }
    public async validate(options?: unknown): Promise<true> { return true; }
    public async configure(options?: unknown): Promise<unknown> { return; }
    public async getHeaders(): Promise<string[]> { return []; }
}