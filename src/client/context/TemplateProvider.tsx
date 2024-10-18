import { useDisclosure } from "@mantine/hooks";
import { ThemeContext } from "./TemplateContext";
import { useState } from "react";

export default function TemplateProvider ({ children }: { children: JSX.Element }) {
    const [opened, handlers] = useDisclosure(false);
    const [input, setInput] = useState<HTMLInputElement>();
    const open = (input?: HTMLInputElement|null) => {
        if (input) setInput(input);
        handlers.open();
    }
    const close = () => {
        setInput(undefined);
        handlers.close();
    }


    return <ThemeContext.Provider value={
        {
            opened,
            open,
            close,
            setInput,
            input,
        }
    }>{children}</ThemeContext.Provider>;
};
