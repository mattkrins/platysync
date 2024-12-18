import { props } from "../operations.js";
import FileDelete from "./FileDelete.js";

export default class FolderDelete extends FileDelete {
    public async execute(props: props<this>) {
        return super.execute(props);
    }
}