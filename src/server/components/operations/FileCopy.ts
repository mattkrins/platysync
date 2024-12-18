import FileMove from "./FileMove.js";
import { props } from "../operations.js";

export default class FileCopy extends FileMove {
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        return super.execute({ action, template, execute, data, ...rest }, true);
    }
}