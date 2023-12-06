import fs from 'fs';
import path from 'path';

const copy = function(src, dest) {
  var exists = fs.existsSync(src);
  var stats = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest); 
    fs.readdirSync(src).forEach(function(childItemName) {
        copy(path.join(src, childItemName),
                        path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

console.log("Packaging app...");

if (!fs.existsSync('dist')) fs.mkdirSync('dist');
if (!fs.existsSync('dist/client')) fs.mkdirSync('dist/client');
if (!fs.existsSync('dist/server')) fs.mkdirSync('dist/server');
copy('WinSW-x64.exe', 'dist/WinSW-x64.exe');
copy('service.xml', 'dist/service.xml');
copy('client/build', 'dist/client/build');
copy('server/package.json', 'dist/server/package.json');
copy('server/src', 'dist/server/src');
copy('server/db', 'dist/server/db');
if (fs.existsSync('dist/start.bat')) fs.unlinkSync('dist/start.bat')
if (fs.existsSync('dist/server/package-lock.json')) fs.unlinkSync('dist/server/package-lock.json')
if (fs.existsSync('dist/server/node_modules')) fs.rmSync('dist/server/node_modules', { recursive: true, force: true });

fs.writeFileSync('dist/install.bat', `@echo off
echo Installing...
@echo>start.bat
@echo WinSW-x64 start service.xml> start.bat
WinSW-x64 install service.xml
cd server
npm install`);

console.log("Done. Available @ ./dist ");