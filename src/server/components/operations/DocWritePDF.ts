import { xError } from "../../modules/common.js";
import { compile } from "../../modules/handlebars.js";
import fs from 'fs-extra';
import { props } from "../operations.js";
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import path from 'path';
import Operation from "../operation.js";

export default class DocWritePDF extends Operation {
    source!: string;
    target!: string;
    validate?: boolean;
    overwrite?: boolean;
    separator?: string;
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        super.execute({ action, template, execute, data, ...rest });
        try {
            data.source = compile(template, action.source);
            data.target = compile(template, action.target);
            data.overwrite = String(action.overwrite||false);
            data.validate = String(action.validate||false);
            if (!data.source) throw new xError("No source provided.");
            if (!data.target) throw new xError("No target provided.");
            if (action.validate) {
                if (!fs.existsSync(data.source)) throw new xError("Source path does not exist.");
                if (!fs.existsSync(data.target)) throw new xError("Target path does not exist.");
            }
            if (!execute) return { data };
            const separator = compile(template, action.separator) || "__";
            const sourceFile = fs.readFileSync(data.source);
            const pdfDoc = await PDFDocument.load(sourceFile);
            const form = pdfDoc.getForm();
            const fields = form.getFields();
            for (const field of fields) {
                const fieldName = field.getName();
                const fieldNameParts = fieldName.split(separator);
                const key = fieldNameParts[0]; // id,name,etc.
                let type = "text";
                if (fieldNameParts.length > 0) type = fieldNameParts[1]; // text,qr,etc.
                const value = compile(template, key);
                switch(type) {
                    case "qr":{
                      const button = form.getButton(fieldName);
                      const url = await QRCode.toDataURL( value );
                      const image = await pdfDoc.embedPng(url);
                      button.setImage(image);
                      break;}
                    default:{
                      const textField = form.getTextField(fieldName);
                      textField.setText(value);}
                }
            }
            const pdfBytes = await pdfDoc.save();
            const folder = path.dirname(data.target);
            if (!fs.existsSync(folder)) fs.mkdirSync(folder);
            fs.writeFileSync(data.target, pdfBytes);
            return { success: true, data };
        } catch (e){
            return { error: new xError(e), data };
        }
    }
}