import Handlebars from "../../modules/handlebars.js";
import * as fs from 'fs';
import { moveFileSync } from 'move-file';
export default async function _moveFile(execute = false, act, template) {
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
        moveFileSync(data.source, data.target, options);
        return { success: true, data };
    }
    catch (e) {
        return { error: String(e), data };
    }
}
