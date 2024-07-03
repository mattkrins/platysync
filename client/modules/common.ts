import { IconProps, Icon, IconFile, IconFileTypeCsv, IconFileTypePdf, IconPhoto, IconFileTypeDocx, IconFileTypeXls, IconFileText, IconFileZip } from "@tabler/icons-react";
import axios from "axios";
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

export const testRegex = (error = "Invalid.", regex: RegExp) => (value: unknown) => regex.test(value as string) ? false : error;
export const isAlphanumeric = (error = "Contains non-alphanumeric characters.") => (value: unknown) => testRegex(error, /^[a-zA-Z0-9_]+$/)(value);

export function checkForUpdate(): Promise<string> {
  return new Promise((resolve, reject) => {
    const axiosClient = axios.create({headers: {'X-GitHub-Api-Version': '2022-11-28'}});
    axiosClient.get("https://api.github.com/repos/mattkrins/platysync/releases")
    .catch(error=>{ console.error('Failed to get latest version', error); reject(error); })
    .then((( response )=>{
        if (!response) return;
        const { data: releases } = response as { data: {name: string}[] };
        const { name: latest } = releases[0];
        resolve(latest);
        return false;
    }));
  });
}

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
