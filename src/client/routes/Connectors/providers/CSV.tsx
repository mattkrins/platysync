import { Select, Checkbox } from "@mantine/core";
import { IconFile, IconTypography } from "@tabler/icons-react";
import Concealer from "../../../components/Concealer";
import { UseFormReturnType } from "@mantine/form";
import ExtTextInput from "../../../components/ExtTextInput";

export default function CSV( { form, path }: { form: UseFormReturnType<Connector>, path?: string } ) {
    return (
    <>
        <ExtTextInput
            label="File Path"
            leftSection={<IconFile size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="C:/folder/input.csv"
            withAsterisk {...form.getInputProps(`${path||''}path`)}
        />
        <Concealer>
            <Checkbox mt="xs" label="Does not contain headers" {...form.getInputProps(`${path||''}noHeaders`, { type: 'checkbox' })} />
            <Select mt="xs"
                label="Text Encoding"
                defaultValue="utf8"
                placeholder="Encoding"
                data={['utf8', 'utf16le', 'latin1', 'base64', 'base64url', 'hex']}
                leftSection={<IconTypography size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                {...form.getInputProps(`${path||''}encoding`)}
            />
        </Concealer>
    </>);
}
