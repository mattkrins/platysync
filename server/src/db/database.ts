import { Sequelize } from 'sequelize';
import models from './models.js';
import { testing } from '../server.js';

export let db: Sequelize;
export async function database(path: string){
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: testing ? ':memory:' : `${path}/database.sqlite`,
        pool: testing ? { max: 1, idle: Infinity, maxUses: Infinity } : undefined,
        logging: false
    });
    models(sequelize);
    db = sequelize;
    await sequelize.sync();
}
