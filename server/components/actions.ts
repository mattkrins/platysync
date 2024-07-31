import FileCopy from "./actions/FileCopy";
import { connections } from "./providers";

export interface actionProps {
  action: Action;
  template: template;
  connections: connections;
  execute: boolean;
  data: {[k: string]: string};
}

interface actionPropsExt extends actionProps {
    action: any;
}

export type operation = (props: actionPropsExt) => Promise<result>;
export const availableActions: { [k: string]: operation } = {
    'Copy File': FileCopy,
}