import axios from "axios";

export const getCookie = (name: string) => document.cookie.split('; ').filter(row => row.startsWith(`${name}=`)).map(c=>c.split('=')[1])[0];
export const onKeyUp = (func:()=>unknown) => (e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && func();

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

export const defaultSchema: Schema = {
  name: '',
  version: '',
  connectors: [],
  rules: [],
};

