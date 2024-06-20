import { createContext } from "react";

export default createContext<{
    connectors: Connector[];
    setConnectors(connectors: Connector[]): void;
}>({
    connectors: [],
    setConnectors: () => void {}
});