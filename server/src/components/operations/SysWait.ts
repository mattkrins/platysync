import { xError } from "../../modules/common.js";
import { Action, actionProps } from "../../typings/common.js";

const wait = (time = 1000) => new Promise((r)=> setTimeout(r, time) );

export interface props extends actionProps {
    action: Action & {
        time: number;
        simulate: boolean;
    }
}

export default async function ({ action, execute, data }: props) {
    try {
        data.waitFor = `${action.time||1000}ms`;
        if (action.simulate) await wait(action.time||1000);
        if (!execute) return { data };
        if (!action.simulate) await wait(action.time||1000);
        return { success: true, data };
    } catch (e){
        return { error: new xError(e), data };
    }
}
