import { DataTypes as DT, Model, Op } from "sequelize";
import { encrypt } from "../modules/cryptography.js";
export class User extends Model {
}
export class Session extends Model {
}
export class Schedule extends Model {
}
//TODO - printing
export default function models(sequelize) {
    User.init({
        username: { type: DT.STRING, primaryKey: true, },
        password: { type: DT.STRING, allowNull: false, },
        iv: { type: DT.STRING },
    }, { sequelize, modelName: 'User', });
    Session.init({
        id: { type: DT.STRING, defaultValue: DT.UUIDV1, primaryKey: true },
        expiresAt: { type: DT.DATE, allowNull: true, },
    }, { sequelize, modelName: 'Session', updatedAt: false });
    Schedule.init({
        id: { type: DT.STRING, defaultValue: DT.UUIDV1, primaryKey: true },
        index: { type: DT.INTEGER, allowNull: false },
        schema: { type: DT.STRING, allowNull: false },
        rules: { type: DT.STRING, allowNull: true },
        cron: { type: DT.STRING, allowNull: true },
        monitor: { type: DT.STRING, allowNull: true },
        enabled: { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
    }, { sequelize, modelName: 'Schedule', updatedAt: false });
    Schedule.beforeValidate(async (schedule) => {
        if (!schedule.isNewRecord)
            return;
        const i = await Schedule.count();
        schedule.index = i;
    });
    Schedule.beforeDestroy(async (schedule) => {
        const higher = await Schedule.findAll({ where: { index: { [Op.gt]: schedule.index } } });
        for (const s of higher) {
            s.index = s.index - 1;
            await s.save();
        }
    });
    User.hasOne(Session);
    User.beforeCreate(async (user) => {
        if (!user.changed('password'))
            return;
        if (user.password == null)
            return;
        const { encrypted, iv } = await encrypt(user.password);
        user.password = encrypted;
        user.iv = iv;
    });
}
