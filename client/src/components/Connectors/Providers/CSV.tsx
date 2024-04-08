import { TextInput } from "@mantine/core";
import { IconTag, IconFolder } from "@tabler/icons-react";
import { UseFormReturnType } from '@mantine/form';
import useTemplater from "../../../hooks/useTemplater";

export default function CSV( { form }: { form: UseFormReturnType<Record<string, unknown>> } ) {
    const { templateProps, explorer } = useTemplater();
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
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="C:/folder/input.csv"
            withAsterisk
            {...form.getInputProps('path')}
            {...templateProps(form.getInputProps('path'))}
        />
    </>);
}