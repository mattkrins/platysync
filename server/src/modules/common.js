import fs from 'fs';
import Papa from 'papaparse';
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'
import path from 'path';

class CodeError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status || 500;
    }
}

export function loadCSV(filePath = "") {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
          if (!fs.existsSync(filePath)) throw new CodeError(`Path '${filePath}' does not exist`, 404);
          if (!fs.lstatSync(filePath).isFile()) throw new CodeError(`Path '${filePath}' is not a file`, 422);
          const file = fs.createReadStream(filePath);
          if (!file) throw new CodeError(`Failed to open '${filePath}'`, 422);
          Papa.parse(file, {
            header: true,
            complete: resolve
          });
      } catch (e) { reject(e); }
    });
}

export function dynamicSort(property) {
  var sortOrder = 1;
  if(property[0] === "-") {
      sortOrder = -1;
      property = property.substr(1);
  }
  return function (a,b) {
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * sortOrder;
  }
}

export function dynamicSortMultiple(...props) {
  return function (obj1, obj2) {
      var i = 0, result = 0, numberOfProperties = props.length;
      while(result === 0 && i < numberOfProperties) {
          result = dynamicSort(props[i])(obj1, obj2);
          i++;
      }
      return result;
  }
}

export async function writePDF(source="", target="", data = {}) {
  const template = fs.readFileSync(source);
  const pdfDoc = await PDFDocument.load(template);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  for (const field of fields) {
    const fieldName = field.getName();
    const fieldNameParts = fieldName.split("__");
    const key = fieldNameParts[0]; // id,name,etc.
    for (const [key, value] of Object.entries(data)) {
      data[key.toLowerCase()] = value;
    }
    if (!data[key.toLowerCase()]) continue;
    const value = data[key.toLowerCase()];
    let type = "text";
    if (fieldNameParts.length > 0) type = fieldNameParts[1]; // text,qr,etc.
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
  const folder = path.dirname(target);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);
  fs.writeFileSync(target, pdfBytes);
  return target;
}

