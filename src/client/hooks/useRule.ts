import { UseFormReturnType } from "@mantine/form";
import { useConnectors } from "./redux";
import { useMemo } from "react";

export default function useRule( form: UseFormReturnType<Rule> ) {
    const { proConnectors } = useConnectors();
    const primary = useMemo(()=>proConnectors.find((item) => item.name === form.values.primary), [ form.values.primary ]);
    return { primary };
}
