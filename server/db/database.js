import { Sequelize } from "sequelize";
import models from "./models.js";
import fs from 'fs';

const tempDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
export const dataPath = `${tempDataPath}/cdapp`;
export const storagePath = `${dataPath}/storage`;
export const dbPath = `${storagePath}/database.sqlite`;

if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath);
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false // ! enable to see raw generated SQL queries in console
});
models(sequelize);
await sequelize.sync();