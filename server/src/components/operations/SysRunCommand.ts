import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { Action, actionProps } from "../../typings/common.js";
import { exec } from 'child_process';

//NOTE - Should work in theory, but not currently implemented due to arbitrary code execution vulnerability concerns:
//NOTE - You should consider submitting a feature request instead of using this. Enable via engine & client:
//LINK - server\src\components\engine.ts:72
//LINK - client\src\components\Rules\Editor\Operations\SysRunCommand.tsx

interface props extends actionProps {
    action: Action & {
        cmd: string;
    }
}

export default async function ({ action, template, execute, data }: props) {
    try {
        data.command = compile(template, action.cmd||"");
        if ( !execute ) return {data};
        const execution: Promise<string> = new Promise((resolve, reject)=>{
            exec(data.cmd, (error, stdout, stderr) => {
                if (error) reject(error.message);
                if (stderr) reject(stderr);
                resolve(stdout);
            });
        })
        data.stdout = await execution;
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
