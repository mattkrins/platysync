import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import { settings } from "../../routes/settings.js";
import { Action, actionProps } from "../../typings/common.js";
import { exec } from 'child_process';

interface props extends actionProps {
    action: Action & {
        value: string;
    }
}

export default async function ({ action, template, execute, data }: props) {
    try {
        if (!settings.enableRun) throw new xError("SysRunCommand action is not enabled.");
        data.command = compile(template, action.value||"");
        if ( !execute ) return {data};
        const execution: Promise<string> = new Promise((resolve, reject)=>{
            exec(data.command, (error, stdout, stderr) => {
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
