import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { props } from "../operations.js";
import { Decrypt } from "../../modules/cryptography.js";
import { ensureMinimumValue } from "./SysEncryptString.js";
import Operation from "../operation.js";

export default class SysDecryptString extends Operation {
    secret!: string;
    password!: string;
    strength?: number;
    key?: string;
    decrypted?: string;
    public async execute({ action, template, data, ...rest }: props<this>) {
        await super.execute({ action, template, data, ...rest });
        try {
            data.secret = compile(template, action.secret);
            data.password = compile(template, action.password);
            data.key = compile(template, action.key, "result");
            if (!data.secret) throw new xError("No secret provided.");
            if (!data.password) throw new xError("No decryption key provided.");
            data.strength = String(action.strength||"1000");
            const strength = ensureMinimumValue(data.strength);
            let hash: Hash;
            try {
                hash = JSON.parse(data.secret);
            } catch (_e) { throw new xError("Secret was not JSON.");}
            const decrypted = await Decrypt(hash, data.password, strength, { hex: "encrypted" });
            data.decrypted = decrypted;
            template[data.key] = decrypted as unknown as {[header: string]: string};
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}
