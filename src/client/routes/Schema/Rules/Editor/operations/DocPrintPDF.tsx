import { Loader, Select, TextInput } from "@mantine/core";
import { IconFile, IconPrinter } from "@tabler/icons-react";
import { operationProps } from "../operations";
import useAPI from "../../../../../hooks/useAPI";
import ExtTextInput from "../../../../../components/ExtTextInput";

export default function DocPrintPDF( { props, rule, blueprint }: operationProps ) {
    const { data: printers, loading } = useAPI<string[]>({
        url: `/rule/getPrinters`, schema: true,
        fetch: true, default: [],
    });
    const printer = props("target").value;
    const merged = printer ? [...printers, printer] : printers;
    const deduplicated = merged.filter((v, i, self) => i === self.findIndex((t) => ( t === v )) );
    return (
    <>
        <ExtTextInput rule={rule}
            label="Source File" withAsterisk={!blueprint?.source}
            description="Path of the PDF to print"
            placeholder="D:/templates/ouput/{{username}}.pdf"
            leftSection={<IconFile size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            {...props("source")}
        />
        <Select withAsterisk={!blueprint?.target}
            label="Target Printer" mt="xs" clearable
            description="Leave blank to use the system's default printer."
            leftSection={loading?<Loader size="xs" />:<IconPrinter size={16} style={{ display: 'block', opacity: 0.8 }} />}
            data={deduplicated}
            placeholder="Select Printer"
            {...props("target")}
        />
    </>
    )
}
