import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra'

const __dirname = dirname(fileURLToPath(import.meta.url));

const json = fs.readFileSync('../package.json', 'utf-8');
const pack = JSON.parse(json);
delete pack.devDependencies;
pack.scripts = {
    "service-install": "WinSW-x64 install service.xml",
    "service-uninstall": "WinSW-x64 uninstall service.xml",
    "service-start": "WinSW-x64 start service.xml",
    "service-stop": "WinSW-x64 stop service.xml",
};

if (!fs.existsSync('dist')) fs.mkdirSync('dist');
fs.writeFileSync('dist/package.json', JSON.stringify(pack, undefined, 2), 'utf8');
if (fs.existsSync('dist/typings')) fs.removeSync('dist/typings');

if (fs.existsSync('WinSW-x64.exe')){
    const xml = `<service>
    <id>${pack.name}</id>
    <description>${pack.description}</description>
    <executable>node</executable>
    <arguments>server.js</arguments>
    <delayedAutoStart>true</delayedAutoStart>
    <log mode="roll-by-size">
        <sizeThreshold>10240</sizeThreshold>
        <keepFiles>8</keepFiles>
    </log>
    <onfailure action="restart" delay="10 sec"/>
</service>`;
    fs.writeFileSync('dist/service.xml', xml, 'utf8');
    fs.copyFileSync('WinSW-x64.exe', 'dist/WinSW-x64.exe');
}

console.log(`Build complete: ${__dirname}\\dist\\`);