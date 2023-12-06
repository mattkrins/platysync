import { Model, DataTypes as DT } from "sequelize";

export class Setting extends Model {}
export class Schema extends Model {}
export class Template extends Model {}
export class Override extends Model {}
export class Rule extends Model {}
export class Condition extends Model {}
export class Attribute extends Model {}
export class Group extends Model {}
export class Print extends Model {}

export default function ( sequelize ) {
    Setting.init({
        key: { type: DT.STRING, primaryKey: true },
        value: { type: DT.STRING, defaultValue: "" },
    }, { sequelize });
    Schema.init({
        name: { type: DT.STRING, allowNull: false, primaryKey: true },
        ldap_uri: { type: DT.STRING, defaultValue: "" },
        ldap_user: { type: DT.STRING, defaultValue: "" },
        ldap_pass: { type: DT.STRING, defaultValue: "" },
        csv_path: { type: DT.STRING, defaultValue: "" },
        csv_header: { type: DT.STRING, defaultValue: "STKEY" },
        base_ou: { type: DT.STRING, defaultValue: "" },
        use_edustar: { type: DT.BOOLEAN, defaultValue: false },
        use_cron: { type: DT.BOOLEAN, defaultValue: false },
        cron: { type: DT.STRING, defaultValue: "0 * * * MON-FRI" },
        csv_monitor: { type: DT.BOOLEAN, defaultValue: false },
        autoexe: { type: DT.BOOLEAN, defaultValue: false },
        printer: { type: DT.STRING, defaultValue: "System Default" },
    }, { sequelize });
    Override.init({
        id: { type: DT.STRING, defaultValue: DT.UUIDV1, primaryKey: true },
        key: { type: DT.STRING, defaultValue: "KEY" },
        value: { type: DT.STRING, defaultValue: "VALUE" },
    }, { sequelize, createdAt: false });
    Schema.hasMany(Override, { onDelete: 'CASCADE' });
    Template.init({
        id: { type: DT.STRING, defaultValue: DT.UUIDV1, primaryKey: true },
        name: { type: DT.STRING, allowNull: false, defaultValue: "Default" },
        cn: { type: DT.STRING, defaultValue: "" },
        sam: { type: DT.STRING, defaultValue: "" },
        upn: { type: DT.STRING, defaultValue: "" },
        ou: { type: DT.STRING, defaultValue: "" },
        pass: { type: DT.STRING, defaultValue: "" },
        pdf_source: { type: DT.STRING, defaultValue: "" },
        pdf_target: { type: DT.STRING, defaultValue: "" },
        remove_groups: { type: DT.BOOLEAN, defaultValue: false },
    }, { sequelize });
    Schema.hasMany(Template, { onDelete: 'CASCADE' });
    Rule.init({
        id: { type: DT.STRING, defaultValue: DT.UUIDV1, primaryKey: true },
        name: { type: DT.STRING, defaultValue: "create" },
        description: { type: DT.STRING, defaultValue: "" },
        type: { type: DT.STRING, defaultValue: "create" },
        enabled: { type: DT.BOOLEAN, defaultValue: false },
        enable_account: { type: DT.BOOLEAN, defaultValue: false },
        gen_pdf: { type: DT.BOOLEAN, defaultValue: false },
        print: { type: DT.BOOLEAN, defaultValue: false },
        ou: { type: DT.STRING, defaultValue: "" },
        edustar: { type: DT.BOOLEAN, defaultValue: false },
        attribute: { type: DT.STRING, defaultValue: "" },
        index: { type: DT.INTEGER, defaultValue: 0 },
    }, { sequelize });
    Template.hasOne(Rule, { onDelete: 'CASCADE' });
    Schema.hasMany(Rule, { onDelete: 'CASCADE' });
    Condition.init({
        id: { type: DT.STRING, defaultValue: DT.UUIDV1, primaryKey: true },
        operand: { type: DT.STRING, defaultValue: "input" },
        operator: { type: DT.STRING, defaultValue: "==" },
        key: { type: DT.STRING, defaultValue: "KEY" },
        value: { type: DT.STRING, defaultValue: "VALUE" },
        delimiter: { type: DT.STRING, defaultValue: "" },
    }, { sequelize });
    Rule.hasMany(Condition, { onDelete: 'CASCADE' });
    Schema.hasOne(Condition, { onDelete: 'CASCADE' });
    Attribute.init({
        id: { type: DT.STRING, defaultValue: DT.UUIDV1, primaryKey: true },
        overwrite: { type: DT.BOOLEAN, defaultValue: false },
        key: { type: DT.STRING, defaultValue: "KEY" },
        value: { type: DT.STRING, defaultValue: "VALUE" },
        encrypt: { type: DT.BOOLEAN, defaultValue: false },
        password: { type: DT.STRING, defaultValue: "" },
    }, { sequelize, createdAt: false });
    Template.hasMany(Attribute, { onDelete: 'CASCADE' });
    Schema.hasOne(Attribute, { onDelete: 'CASCADE' });
    Group.init({
        id: { type: DT.STRING, defaultValue: DT.UUIDV1, primaryKey: true },
        value: { type: DT.STRING, defaultValue: "VALUE" },
    }, { sequelize, createdAt: false });
    Template.hasMany(Group, { onDelete: 'CASCADE' });
    Schema.hasOne(Group, { onDelete: 'CASCADE' });
    Print.init({
        id: { type: DT.STRING, defaultValue: DT.UUIDV1, primaryKey: true },
        path: { type: DT.STRING, defaultValue: "" },
        status: { type: DT.INTEGER, defaultValue: 0 },
        sam: { type: DT.STRING, defaultValue: "" },
    }, { sequelize });
    Schema.hasOne(Print, { onDelete: 'CASCADE' });
}