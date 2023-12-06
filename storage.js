import * as fs from 'fs';
import YAML, { stringify } from 'yaml';
export function readYAML(path) {
    const file = fs.readFileSync(path, 'utf8');
    return YAML.parse(file);
}
export function writeYAML(data, path) {
    const yamlString = stringify(data);
    fs.writeFileSync(path, yamlString);
}
export const deleteFolderRecursive = (path) => {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file) => {
            const curPath = `${path}/${file}`;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            }
            else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};
