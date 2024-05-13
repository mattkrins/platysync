import { Input, SegmentedControl, TextInput } from "@mantine/core";
import { IconTag, IconFolder } from "@tabler/icons-react";
import { UseFormReturnType } from '@mantine/form';

export default function FOLDER( { form }: { form: UseFormReturnType<Record<string, unknown>> } ) {
    return (
    <>
        <TextInput
            label="Connector Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="File Name"
            withAsterisk {...form.getInputProps('name')}
        />
        <TextInput
            label="Folder Path" mt="md"
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="C:/folder"
            withAsterisk
            {...form.getInputProps('path')}
        />
        <Input.Wrapper mt="xs" withAsterisk
        label="Iterate Over"
        >
        <SegmentedControl fullWidth 
        {...form.getInputProps('type')}
        defaultValue="both"
        data={[
        { label: 'Files', value: 'file' },
        { label: 'Directory', value: 'directory' },
        { label: 'Both', value: 'both' },
        ]} />
        </Input.Wrapper>
    </>);
}