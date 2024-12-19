import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import Operation from "../operation.js";
import { props } from "../operations.js";
import { spawn } from 'child_process';

export default class SysRunCommand extends Operation {
    command!: string;
    timeout?: number;
    detached?: boolean;
    kill?: boolean;
    key?: string;
    elapsed?: string;
    stdout?: string;
    public async execute({ action, template, execute, data, settings, ...rest }: props<this>) {
        await super.execute({ action, template, execute, data, settings, ...rest });
        try {
            if (!settings.enableRun) throw new xError("SysRunCommand action is not enabled.");
            data.command = compile(template, action.command);
            data.detached = String(action.detached||false);
            data.kill = String(action.kill||false);
            data.timeout = String(action.timeout||"5000");
            data.key = compile(template, action.key, "stdout");
            if (!data.command) throw new xError("No command provided.");
            if (!execute) return { data };
            const timeout = parseInt(data.timeout);
            function runCommand(): Promise<string> {
                return new Promise((resolve, reject) => {
                    const [cmd, ...args] = data.command.split(' ');
                    const child = spawn(cmd, args, {
                        detached: !!action.detached,
                        stdio: action.detached ? 'ignore' : 'pipe', // Ignore stdio if detached
                        shell: true,
                    });
                    let timeoutId: NodeJS.Timeout | null = null;
                    timeoutId = setTimeout(() => {
                        if (!child.pid) return;
                        if (action.kill) process.kill(-child.pid); // Kill the entire process group
                        reject(new Error(`Command timed out after ${timeout}ms`));
                    }, timeout);
                    if (action.detached) {
                        child.unref();
                        resolve("");
                    }
                    let stdout = '';
                    child.stdout?.on('data', (data) => {
                        stdout += data.toString();
                    });
                    child.stderr?.on('data', (data) => {
                        stdout += data.toString(); // Include stderr in output
                    });
                    child.on('close', (code) => {
                        if (timeoutId) clearTimeout(timeoutId);
                        if (code === 0) {
                            resolve(stdout.trim());
                        } else {
                            reject(new Error(`Process exited with code ${code}`));
                        }
                    });
                    child.on('error', (err) => {
                        if (timeoutId) clearTimeout(timeoutId);
                        reject(err);
                    });
                })
            }
            const start = new Date().getTime();
            const stdout = await runCommand();
            const elapsed = new Date().getTime() - start;
            if (!action.detached) {
                data.elapsed = `${String(elapsed)}ms`;
                data.stdout = String(stdout||false);
                template[data.key] = stdout as unknown as {[header: string]: string};
            }
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}