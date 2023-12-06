import Handlebars from "../../modules/handlebars.js";
import fs from 'fs-extra';
export default async function moveFolder(execute = false, act, template) {
    const action = act;
    const data = {};
    try {
        data.source = Handlebars.compile(action.source)(template);
        data.target = Handlebars.compile(action.target)(template);
        data.overwrite = String(action.overwrite);
        if (action.validate)
            if (!fs.existsSync(data.source))
                return { warning: `Source path does not exist.`, data };
        if (!execute)
            return { data };
        const options = {
            overwrite: action.overwrite || false
        };
        fs.moveSync(data.source, data.target, options);
        return { success: true, data };
    }
    catch (e) {
        return { error: String(e), data };
    }
}
