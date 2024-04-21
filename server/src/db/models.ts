import { DataTypes as DT, Model, Op } from "sequelize";
import { Sequelize } from 'sequelize';
import { encrypt } from "../modules/cryptography.js";

export class User extends Model {
    declare username: string;
    declare password: string;
    declare iv: string;
    declare stats: boolean;
    declare enabled: boolean;
    declare group: string;
    declare createdAt: string;
    declare updatedAt: string;
}

export class Session extends Model {
    declare id: string;
    declare createdAt: string;
    declare expiresAt: string;
    declare UserUsername: string;
}

export class Schedule extends Model {
    declare id: string;
    declare index: number;
    declare schema: string;
    declare rules: string;
    declare type: 'cron'|'monitor';
    declare value: string;
    declare enabled: boolean;
    declare createdAt: string;
    declare expiresAt: string;
    declare error?: string;
}

export class Doc extends Model {
    declare id: string;
    declare index: number;
    declare schema: string;
    declare name: string;
    declare ext?: string;
}

export default function models( sequelize: Sequelize ) {
    User.init( {
        username: { type: DT.STRING, primaryKey: true, },
        password: { type: DT.STRING, allowNull: false, },
        iv: { type: DT.STRING },
        stats: { type: DT.BOOLEAN, allowNull: false, defaultValue: false, },
        enabled: { type: DT.BOOLEAN, allowNull: false, defaultValue: true, },
        group: { type: DT.STRING, allowNull: false, defaultValue: 'user', },
    }, { sequelize, modelName: 'User', } );
    Session.init( {
        id: { type: DT.STRING, defaultValue: DT.UUIDV1, primaryKey: true },
        expiresAt: { type: DT.DATE, allowNull: true, },
    }, { sequelize, modelName: 'Session', updatedAt: false } );
    Schedule.init( {
        id: { type: DT.STRING, defaultValue: DT.UUIDV1, primaryKey: true },
        index: { type: DT.INTEGER, allowNull: false, defaultValue: 0 },
        schema: { type: DT.STRING, allowNull: false },
        rules: { type: DT.STRING, allowNull: true },
        type: { type: DT.STRING, allowNull: false, defaultValue: 'cron', validate: { isIn: [['cron', 'monitor']] } },
        value: { type: DT.STRING, allowNull: false, defaultValue: '0 * * * MON-FRI' },
        enabled: { type: DT.BOOLEAN, allowNull: false, defaultValue: false },
    }, { sequelize, modelName: 'Schedule', updatedAt: false } );
    Schedule.beforeValidate (async (row) => {
        if (!row.isNewRecord) return;
        const i = await Schedule.count();
        row.index = i;
    });
    Schedule.beforeDestroy (async (row) => {
        const higher = await Schedule.findAll({where: { index: { [Op.gt]: row.index } }});
        for (const s of higher) {
            s.index = s.index - 1;
            await s.save();
        }
    });
    User.hasMany(Session);
    Session.belongsTo(User, { foreignKey: 'UserUsername', targetKey: 'username' });
    User.beforeCreate (async (user) => {
        if (!user.changed('password')) return;
        if (user.password == null) return;
        const { encrypted, iv } = await encrypt(user.password);
        user.password = encrypted;
        user.iv = iv;
    });
    User.beforeUpdate (async (user) => {
        if (user.changed('password')) {
            if (user.password == null) return;
            const { encrypted, iv } = await encrypt(user.password);
            user.password = encrypted;
            user.iv = iv;
        }
    });
    Doc.init( {
        id: { type: DT.STRING, defaultValue: DT.UUIDV1, primaryKey: true },
        index: { type: DT.INTEGER, allowNull: false, defaultValue: 0 },
        schema: { type: DT.STRING, allowNull: false },
        name: { type: DT.STRING, allowNull: false },
        ext: { type: DT.STRING, allowNull: true },
    }, { sequelize, modelName: 'File' } );
    Doc.beforeValidate (async (row) => {
        if (!row.isNewRecord) return;
        row.ext = row.ext || (row.name||"unknown").split(".")[1];
        const i = await Doc.count({where: { schema: row.schema }});
        row.index = i;
    });
    Doc.beforeDestroy (async (row) => {
        const higher = await Doc.findAll({where: { index: { [Op.gt]: row.index }, schema: row.schema }});
        for (const s of higher) {
            s.index = s.index - 1;
            await s.save();
        }
    });
}