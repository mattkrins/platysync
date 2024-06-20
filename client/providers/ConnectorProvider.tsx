import { PropsWithChildren, useState } from "react";
import ConnectorContext from "./ConnectorContext";

export default function ConnectorProvider({ children }: PropsWithChildren) {
    const [connectors, setConnectors] = useState<Connector[]>([]);
    return (
        <ConnectorContext.Provider value={{
            connectors,
            setConnectors
        }}>{children}</ConnectorContext.Provider>
    );
}
