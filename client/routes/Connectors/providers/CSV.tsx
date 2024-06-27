import { TextInput, Select, Checkbox } from "@mantine/core";
import { IconFile, IconTypography } from "@tabler/icons-react";
import Concealer from "../../../components/Concealer";
import { UseFormReturnType } from "@mantine/form";
import useTemplater from "../../../hooks/useTemplater";

export default function CSV( { form }: { form: UseFormReturnType<Connector> } ) {
    const { templateProps, explorer } = useTemplater({context:[]});
    return (
    <>  {explorer}
        <TextInput
            label="File Path"
            leftSection={<IconFile size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="C:/folder/input.csv"
            withAsterisk {...templateProps(form, 'path')}
            error={form.getInputProps('path').error||templateProps(form, 'path').error}
        />
        <Concealer>
            <Checkbox mt="xs" label="Does not contain headers" {...form.getInputProps('noHeaders', { type: 'checkbox' })} />
            <Select mt="xs"
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
