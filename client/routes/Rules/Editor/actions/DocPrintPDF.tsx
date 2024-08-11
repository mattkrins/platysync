import { Loader, Select, TextInput } from "@mantine/core";
import { IconFile, IconPrinter } from "@tabler/icons-react";
import { actionProps } from "../../../../modules/actions";
import useAPI from "../../../../hooks/useAPI";

export default function DocPrintPDF( { form, path, templateProps }: actionProps ) {
    const { data: printers, loading } = useAPI<string[]>({
        url: `/rule/getPrinters`, schema: true,
        fetch: true, default: [],
    });
    const printer = form.getInputProps(`${path}.target`).value;
    const merged = printer ? [...printers, printer] : printers;
    const deduplicated = merged.filter((v, i, self) => i === self.findIndex((t) => ( t === v )) );
    return (
    <>
        <TextInput
            label="Source File" withAsterisk
            description="Path of the PDF to print"
            placeholder="D:/templates/ouput/{{username}}.pdf"
            leftSection={<IconFile size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...templateProps(form, `${path}.source`)}
        />
        <Select
            label="Target Printer" withAsterisk clearable
            description="Leave blank to use the system's default printer."
            leftSection={loading?<Loader size="xs" />:<IconPrinter size={16} style={{ display: 'block', opacity: 0.8 }} />}
            placeholder="Select Printer"
            {...form.getInputProps(`${path}.target`)}
            data={deduplicated}
        />
    </>
    )
}
