import Print from "../components/Rules/Editor/Operations/DocPrint";
import WritePDF from "../components/Rules/Editor/Operations/DocWritePDF";

export const actions: {
    id: string;
    name: string;
    element: (props: ActionItem) => JSX.Element;
}[] = [
    { id: "print", name: "Send To Printer", element: Print },
    { id: "writePDF", name: "Write PDF", element: WritePDF },
];