import { IconProps, Icon, IconFile, IconFileTypeCsv, IconFileTypePdf, IconPhoto, IconFileTypeDocx, IconFileTypeXls, IconFileText, IconFileZip, IconAlertCircle, IconPlayerPlay, IconRun } from "@tabler/icons-react";
import axios from "axios";
import cronstrue from "cronstrue";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export const getCookie = (name: string) => document.cookie.split('; ').filter(row => row.startsWith(`${name}=`)).map(c=>c.split('=')[1])[0];
export const onKeyUp = (func:()=>unknown) => (e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && func();
export const download = (url: string) => { window.open(`/api/v1/${url}`, "_blank"); }
export function compareVersion(a: string, b: string) {
  const regExStrip0 = /(\.0+)+$/;
  const segmentsA = a.replace(regExStrip0, '').split('.');
  const segmentsB = b.replace(regExStrip0, '').split('.');
  const l = Math.min(segmentsA.length, segmentsB.length);
  for (let i = 0; i < l; i++) {
    const diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10)
    if (diff) return diff;
  } return segmentsA.length - segmentsB.length;
}


export function validStr(string?: unknown) {
  if (!string) return false;
  if (typeof string !== "string") return false;
  if (string.trim()==="") return false;
  return true;
}

export const testRegex = (error = "Invalid.", regex: RegExp) => (value: unknown) => regex.test(value as string) ? false : error;
export const isAlphanumeric = (error = "Contains non-alphanumeric characters.") => (value: unknown) => validStr(value) ? testRegex(error, /^[a-zA-Z0-9_]+$/)(value) : "Can not be empty";

export function triggerDetails(entry: Trigger) {
  switch (entry.name) {
    case "cron":{
      const cron = cronstrue.toString(entry.cron||"", { throwExceptionOnParseError: false });
      const invalidCron = (cron||"").includes("An error occured when generating the expression description");
      return invalidCron ? cron : `Runs ${cron}`;
    }
    case "watch": return `Watching for changes to '${entry.watch}'`;
    default: return "Error";
  }
}

export const events: {[event: string]: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>} = {
  error: IconAlertCircle,
  evaluate: IconPlayerPlay,
  execute: IconRun,
};

export const colors: {[level: string]: string} = {
  silly: 'indigo',
  debug: 'blue',
  verbose: 'cyan',
  http: 'green',
  info: 'lime',
  warn: 'orange',
  error: 'red',
};

export const fileIcons: {[k: string]:  {
  Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
  color?: string;
}} = {
  txt: { Icon: IconFile },
  csv: { Icon: IconFileTypeCsv, color: "teal" },
  json: { Icon: IconFileText, color: "teal" },
  xml: { Icon: IconFileText, color: "teal" },
  pdf: { Icon: IconFileTypePdf, color: "red" },
  jpg: { Icon: IconPhoto, color: "orange" },
  png: { Icon: IconPhoto, color: "orange" },
  gif: { Icon: IconPhoto, color: "orange" },
  doc: { Icon: IconFileTypeDocx, color: "blue" },
  docx: { Icon: IconFileTypeDocx, color: "blue" },
  xls: { Icon: IconFileTypeXls, color: "green" },
  xlsx: { Icon: IconFileTypeXls, color: "green" },
  zip: { Icon: IconFileZip, color: "yellow" },
}
