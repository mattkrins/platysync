import { TextInput, Input, SegmentedControl } from "@mantine/core";
import { IconFolder } from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import useTemplater from "../../../hooks/useTemplater";

export default function FOLDER( { form }: { form: UseFormReturnType<Connector> } ) {
    const { templateProps, explorer } = useTemplater({names:[]});
    return (
    <>  {explorer}
        <TextInput
            label="Folder Path"
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="C:/folder/input/"
            withAsterisk {...templateProps(form, 'path')}
            error={form.getInputProps('path').error||templateProps(form, 'path').error}
        />
        <Input.Wrapper mt="xs" withAsterisk
        label="Iterate Over"
        >
        <SegmentedControl fullWidth 
        {...form.getInputProps('type')}
        defaultValue="file"
        data={[
        { label: 'Files', value: 'file' },
        { label: 'Directory', value: 'directory' },
        { label: 'Both', value: 'both' },
        ]} />
        </Input.Wrapper>
    </>);
}
