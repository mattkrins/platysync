import { props } from "../operations.js";
import FolderMove from "./FolderMove.js";

export default class FolderCopy extends FolderMove {
    public async execute({ action, template, execute, data, ...rest }: props<this>) {
        return super.execute({ action, template, execute, data, ...rest }, true);
    }
}