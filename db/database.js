import { Sequelize } from 'sequelize';
import models from './models.js';
export async function database(path) {
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: `${path}/database.sqlite`,
        logging: false
    });
    models(sequelize);
    await sequelize.sync();
    //await sequelize.sync({ force: true });
}
