import { Action, template, result } from '../../typings/common.js'
import Handlebars from "../../modules/handlebars.js";
import { exec } from 'child_process';

interface RunCommand extends Action {
    cmd: string;
}

//NOTE - Should work in theory, but not currently implemented due to arbitrary code execution vulnerability concerns:
//NOTE - You should consider submitting a feature request instead of using this.
//LINK - server\src\components\rules.ts
//LINK - client\src\components\Rules\Editor\Operations\SysRunCommand.tsx

export default async function runCommand(execute = false, act: Action, template: template): Promise <result> {
    const action = act as RunCommand;
    const data: {[k: string]: string} = {};
    try {
        data.cmd = Handlebars.compile(action.cmd)(template);
        if (!execute) return {data};
        return new Promise((resolve) => {
            exec(data.cmd, (error, stdout, stderr) => {
                if (error) { resolve({error: error.message, data}); return; }
                if (stderr) { resolve({warning: stderr, data}); return; }
                resolve({template: true, data: { ...data, stdout }});
            });
        })
    } catch (e){
        return {error: String(e), data};
    }
}
