import { Select, TextInput } from "@mantine/core";
import { IconTag, IconFile, IconTypography } from "@tabler/icons-react";
import { UseFormReturnType } from '@mantine/form';
import useTemplater from "../../../hooks/useTemplater";
import Concealer from "../../Common/Concealer";

export default function CSV( { form }: { form: UseFormReturnType<Record<string, unknown>> } ) {
    const { templateProps, explorer } = useTemplater({allow:[]});
    return (
    <>
        {explorer}
        <TextInput
            label="Connector Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="File Name"
            withAsterisk {...form.getInputProps('name')}
        />
        <TextInput
            label="File Path" mt="md"
            leftSection={<IconFile size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="C:/folder/input.csv"
            withAsterisk
            {...templateProps(form, 'path')}
        />
        <Concealer>
            <Select mt="md"
                label="Text Encoding"
                defaultValue="utf8"
                placeholder="Encoding"
                data={['utf8', 'utf16le', 'latin1', 'base64', 'base64url', 'hex']}
                leftSection={<IconTypography size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                {...form.getInputProps('encoding')}
            />
        </Concealer>
    </>);
}