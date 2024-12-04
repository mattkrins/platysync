import { useMemo } from "react";
import { useConnectors } from "./redux";

export default function useRule(rule: Rule) {
    const { proConnectors } = useConnectors();
    const primary = useMemo(()=>proConnectors.find((item) => item.name === rule.primary), [ rule.primary ]);
    const primaryHeaders = primary ? primary.headers : [];
    const displayExample = `{{${rule.primary?`${rule.primary}.`:''}${rule.primaryKey ? rule.primaryKey :  (primaryHeaders[0] ? primaryHeaders[0] : 'id')}}}`;
    const sources = useMemo(()=> rule.primary ? [
        rule.primary,
        ...(rule.sources || []).map(s=>s.foreignName as string),
    ] : [], [ rule ] );
    const sourceProConnectors = useMemo(()=>proConnectors.filter(c=>sources.includes(c.name)), [ sources ]);
    return { proConnectors, primary, primaryHeaders, displayExample, sources, sourceProConnectors };
}
