import { Modal, SimpleGrid, UnstyledButton, useMantineTheme, Text, Group, Anchor, Divider, TextInput, Button, Alert } from "@mantine/core";
import { UseFormReturnType, isNotEmpty, useForm } from "@mantine/form";
import classes from './Editor.module.css';
import { availableAction, availableActions } from "../../modules/actions";
import Wrapper from "../../components/Wrapper";
import { IconAlertCircle, IconCheck, IconTag } from "@tabler/icons-react";
import useAPI from "../../hooks/useAPI";
import { useState } from "react";

const base_validation = {
  name: isNotEmpty('Name can not be empty.'),
}

function Configuration({ form, editing }: { form: UseFormReturnType<ActionConfig>, editing: boolean }) {
    const { Options, label } = availableActions.find(a=>a.name===form.values.id) as availableAction;
    const templateProps = (form: UseFormReturnType<any>, path: string) => form.getInputProps(path);
    return (
    <>
        <TextInput withAsterisk
            label="Config Name"
            placeholder={label}
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            {...form.getInputProps('name')}
        />
        {Options&&<Options path="config" form={form as UseFormReturnType<any>} templateProps={templateProps} config />}
    </>
    )
}

function AvailableActionList({ select } : { select(a: availableAction): void } ) {
    const theme = useMantineTheme();
    return <SimpleGrid cols={4} mt="md">{availableActions.filter(a=>a.Options).map(a=>
        <UnstyledButton onClick={()=>select(a)} key={a.name} className={classes.item} >
            <a.Icon size={32} color={a.color?theme.colors[a.color][6]:undefined} />
            <Text size="xs" mt={5} >{a.label}</Text>
        </UnstyledButton>)}
    </SimpleGrid>
}

function Content({ action, refresh, adding, close }: { action: ActionConfig, refresh(): void, adding: boolean, close(): void }) {
    const editing = action.name;
    const act = (availableActions.find(a=>a.name===action.id) || {}) as availableAction;
    const theme = useMantineTheme();
    const [ validate, setValidation ] = useState<{[value: string]: (...v: unknown[]) => unknown}>({...base_validation, ...act.validate});
    const form = useForm<ActionConfig>({ validate, initialValues: structuredClone(action) });
    const { data: success, put, post, loading, error } = useAPI<unknown, ActionConfig>({
        url: `/action${adding?'':`/${editing}`}`, schema: true, form: form,
        then: () => { refresh(); close(); },
    });
    const select = (a: availableAction) => {
        form.setFieldValue('id',a.name);
        setValidation({...base_validation, ...a.validate});
        if (!a.initialValues) return;
        for (const key of Object.keys(a.initialValues)) form.setFieldValue(key,a.initialValues[key]);
    }
    return (
        <>
            {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">Action config {adding ? "added" : "updated"} successfully.</Alert>}
            {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
            {form.values.id ? <Configuration form={form} editing={!!editing} /> : <AvailableActionList select={select} />}
            <Group mt="xs" justify="flex-end"><Button loading={loading} onClick={()=>adding?post():put()}>{adding ? "Add" : "Save"}</Button></Group>
        </>
    )
}

export default function Editor({ editing, close, refresh }: { editing?: [ActionConfig,boolean], close(): void, refresh(): void }) {
    const adding = (editing && editing[0] && !editing[1]) || false ;
    return (
    <Modal size="lg" opened={!!editing} onClose={close} title={adding?"Add Action":"Edit Action"} styles={adding?{content:{background:"none"},header:{background:"none"}}:undefined} closeOnClickOutside={!adding} >
        {editing&&(editing[0].name?
        <Content action={editing[0]} refresh={refresh} adding={adding} close={close} />:
        <Wrapper><Content action={editing[0]} refresh={refresh} adding={adding} close={close} /></Wrapper>)}
    </Modal>
    );
}