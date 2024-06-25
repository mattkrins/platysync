import { useDispatch as useDispatchX, useSelector as useSelectorX } from "react-redux";
import type { AppDispatch, RootState } from "../providers/store";

export const useDispatch = useDispatchX.withTypes<AppDispatch>();
export const useSelector = useSelectorX.withTypes<RootState>();

export function useLoader() {
    return useSelector(state => state.load);
}