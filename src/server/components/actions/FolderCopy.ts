import FolderMove, { FolderMoveProps } from "./FolderMove.js";

export default async function FolderCopy(props: FolderMoveProps) {
    return FolderMove(props, true);
}
