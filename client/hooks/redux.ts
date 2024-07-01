import { useDispatch as useDispatchX, useSelector as useSelectorX } from "react-redux";
import type { AppDispatch, RootState } from "../providers/store";
import { getConnectors } from "../providers/schemaSlice";
import { useMemo } from "react";
import { providers, provider } from "../modules/providers";

export const useDispatch = useDispatchX.withTypes<AppDispatch>();
export const useSelector = useSelectorX.withTypes<RootState>();

export function useLoader() { return useSelector(state => state.load); }
export function useConnectors() {
    const connectors = useSelector(getConnectors);
    const proConnectors = useMemo(()=>connectors.filter(c=>c.type==="provider").map((c)=>{
        const { name, ...provider} = ((providers.find(p=>p.id===c.id) || {}) as provider);
        return { ...c, ...provider, pName: name };
    }),[ connectors ]);
    return { connectors, proConnectors };
}