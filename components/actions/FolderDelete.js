import Handlebars from "../../modules/handlebars.js";
import fs from 'fs-extra';
export default async function deleteFolder(execute = false, act, template) {
    const action = act;
    const data = {};
    try {
        data.target = Handlebars.compile(action.target)(template);
        if (action.validate)
            if (!fs.existsSync(data.target))
                return { warning: `Target path does not exist.`, data };
        if (!execute)
            return { data };
        fs.removeSync(data.target);
        return { success: true, data };
    }
    catch (e) {
        return { error: String(e), data };
    }
}
