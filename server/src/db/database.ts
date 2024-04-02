import { Sequelize } from 'sequelize';
import models from './models.js';

export let db: Sequelize;
export async function database(path: string){
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: `${path}/database.sqlite`,
        logging: false
    });
    models(sequelize);
    db = sequelize;
    await sequelize.sync();
    //await sequelize.sync({ alter: true }); 
    //await sequelize.sync({ force: true }); 
}
