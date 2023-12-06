import * as fs from 'node:fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const json = fs.readFileSync('package.json');
const pack = JSON.parse(json);
delete pack.devDependencies;
delete pack.scripts;
if (!fs.existsSync('dist')) fs.mkdirSync('dist');
fs.writeFileSync('dist/package.json', JSON.stringify(pack, undefined, 2), 'utf8');

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
    const service = `@echo off
echo Installing...
@echo>start-service.bat
@echo WinSW-x64 start service.xml> start.bat
WinSW-x64 install service.xml
npm install`;
    fs.writeFileSync('dist/install-service.bat', service, 'utf8');
}

console.log(`Build complete: ${__dirname}\\dist\\`);