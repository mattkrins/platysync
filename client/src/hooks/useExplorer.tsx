import { useContext } from "react";
import AppContext from "../providers/AppContext";

export default function useExplorer() {
    const { version } = useContext(AppContext);
    return (
    {}
    )
}
