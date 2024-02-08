import { compile } from "../../modules/handlebars.js";
import { Action } from "../../typings/common.js";
import { actionProps } from "../engine.js";
import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import path from 'path';


interface props extends actionProps {
    action: Action & {
        source: string;
        target: string;
    }
}

export default async function ({ action, template, execute, data }: props) {
    try {
        data.source = compile(template, action.source);
        data.target = compile(template, action.target);
        if (!fs.existsSync(data.source)) return {error: `Path '${data.source}' does not exist`, data};
        if (!execute) return {data};
        const sourceFile = fs.readFileSync(data.source);
        const pdfDoc = await PDFDocument.load(sourceFile);
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        for (const field of fields) {
            const fieldName = field.getName();
            const fieldNameParts = fieldName.split("__");
            const key = fieldNameParts[0]; // id,name,etc.
            let type = "text";
            if (fieldNameParts.length > 0) type = fieldNameParts[1]; // text,qr,etc.
            const value = Handlebars.compile(key)(template);
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
        return {success: true, data};
    } catch (e){
        return {error: String(e), data};
    }
}
