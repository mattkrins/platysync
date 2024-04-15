import { TextInput } from "@mantine/core";
import { IconTag, IconFile } from "@tabler/icons-react";
import { UseFormReturnType } from '@mantine/form';
import useTemplater from "../../../hooks/useTemplater";

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
    </>);
}