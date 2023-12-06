![logo](https://github.com/mattkrins/cdapp/assets/2367602/348236a9-0eb8-4071-b3f3-1bac955aac62)
# cdapp
Automate the management of LDAP and other targets using CSV and other sources.

## Installation
Clone / download repository and in the root folder run:
```bash
$ npm install
```
You can use the `install-service.bat` script to install the app as a windows service.
[Customise](https://github.com/winsw/winsw/blob/v3/docs/xml-config-file.md) `service.xml` as required.

## Running
If you installed as a windows service, start the service via windows services mmc, or run `start-service.bat`.
Otherwise standard node enviornment rules apply - run:
```bash
$ npm start
or
$ node server.js
```

