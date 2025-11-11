import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import AdmZip from 'adm-zip'

console.log("Post-Build started.");

const __dirname = dirname(fileURLToPath(import.meta.url));

const json = fs.readFileSync(`${__dirname}/../package.json`, 'utf-8');
const pack = JSON.parse(json);
delete pack.devDependencies;
pack.scripts = {
    "service-install": "WinSW-x64 install service.xml",
    "service-uninstall": "WinSW-x64 uninstall service.xml",
    "service-start": "WinSW-x64 start service.xml",
    "service-stop": "WinSW-x64 stop service.xml",
};
if (!fs.existsSync(`${__dirname}/dist`)) fs.mkdirSync(`${__dirname}/dist`);
if (fs.existsSync(`${__dirname}/../README.md`)) fs.copyFileSync(`${__dirname}/../README.md`, `${__dirname}/dist/README.md`);
fs.writeFileSync(`${__dirname}/dist/package.json`, JSON.stringify(pack, undefined, 2), 'utf8');
if (fs.existsSync(`${__dirname}/WinSW-x64.exe`) && !fs.existsSync(`${__dirname}/dist/WinSW-x64.exe`)){
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
    <onfailure action="none" delay="10 sec"/>
</service>`;
    fs.writeFileSync(`${__dirname}/dist/service.xml`, xml, 'utf8');
     fs.copyFileSync(`${__dirname}/WinSW-x64.exe`, `${__dirname}/dist/WinSW-x64.exe`);
}

const zip = new AdmZip();
zip.addZipComment(`${pack.name} ver ${pack.version} - Release Package`)
zip.addLocalFolder(`${__dirname}/dist`, '', f=>!f.includes("node_modules") );
zip.writeZip(`${__dirname}/${pack.name} ${pack.version}.zip`);

console.log(`Build complete: ${__dirname}\\dist\\`);