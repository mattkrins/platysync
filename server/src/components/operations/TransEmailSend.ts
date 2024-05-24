import { xError } from "../../modules/common.js";
import { empty } from "../engine.js";
import { compile } from "../../modules/handlebars.js";
import { Action, actionProps } from "../../typings/common.js";
import EMAIL, { email_options } from "../providers/email.js";
import { Connectors } from "../models.js";

interface props extends actionProps {
    action: Action & {
        source: string;
        target: string;
        subject: string;
        text: string;
        html: string;
    }
}

export default async function ({ action, template, execute, data, schema }: props) {
    try {
        data.to = compile(template, action.target);
        if (empty(data.to)) throw new xError("No target/to provided.");
        data.subject = compile(template, action.subject);
        data.text = compile(template, action.text);
        data.html = compile(template, action.html||action.text);
        const connectors = new Connectors(schema.name);
        const provider = connectors.get(action.source) as unknown as email_options;
        const email = new EMAIL({...provider, schema});
        await email.validate();
        if (!execute) return { data };
        await email.configure();
        await email.send(data.to, data.subject, data.text, data.html);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
