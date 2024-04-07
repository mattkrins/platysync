import { TextInput } from "@mantine/core";
import { IconTag, IconFolder } from "@tabler/icons-react";
import { UseFormReturnType } from '@mantine/form';
import { useContext } from "react";
import ExplorerContext from "../../../providers/ExplorerContext";
import useTemplate from "../../../hooks/useTemplate";

export default function CSV( { form }: { form: UseFormReturnType<Record<string, unknown>> } ) {
    const { explorer, explore } = useContext(ExplorerContext);
    const [ templateProps ] = useTemplate();
    const modifyCondition = (key: string) => () => explore(() => (value: string) => form.setFieldValue(key, `${form.values[key]||''}{{${value}}}`), [])
    const inputProps = (key: string) => templateProps( modifyCondition(key), form.getInputProps(key)  );
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
            {...inputProps('path')}
        />
    </>);
}