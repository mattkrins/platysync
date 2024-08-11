import FileMove, { FileMoveProps } from "./FileMove.js";

export default async function FileCopy(props: FileMoveProps) {
    return FileMove(props, true);
}