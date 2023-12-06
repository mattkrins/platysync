import Handlebars from "../../modules/handlebars.js";
import * as fs from 'fs';
export default async function deleteFile(execute = false, act, template) {
    const action = act;
    const data = {};
    try {
        data.target = Handlebars.compile(action.target)(template);
        if (action.validate)
            if (!fs.existsSync(data.target))
                return { warning: `Target path does not exist.`, data };
        if (!execute)
            return { data };
        fs.unlinkSync(data.target);
        return { success: true, data };
    }
    catch (e) {
        return { error: String(e), data };
    }
}
