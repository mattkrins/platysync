import { Alert, Center, Group, Loader, Modal, Progress, SimpleGrid, Stepper, Text, TextInput, UnstyledButton, useMantineTheme } from "@mantine/core";
import Wrapper from "../../components/Wrapper";
import classes from './Editor.module.css';
import { IconAlertCircle, IconArrowBigRight, IconCheck, IconTag, IconTestPipe } from "@tabler/icons-react";
import { provider, providers } from "../../modules/providers";
import { useState } from "react";
import { useForm } from "@mantine/form";
import SplitButton from "../../components/SplitButton";
import useAPI from "../../hooks/useAPI";

function Headers() {
    return (<>
        <Center><Group><Loader size="sm" type="dots" /><Text>Autodetecting Headers...</Text></Group></Center>
    
    </>)
}

function ActionButton( { save, loading, validate, force }: { save(): void, loading?: boolean, validate(): void, force(): void } ) {
  const theme = useMantineTheme();
  return (
    <SplitButton loading={loading} onClick={save} options={[
      {  onClick:()=>validate(), label: 'Validate', leftSection: <IconTestPipe size={16} color={theme.colors.green[5]}  /> },
      {  onClick:()=>force(), label: 'Force Continue', leftSection: <IconArrowBigRight size={16} color={theme.colors.orange[5]}  /> },
      ]} >Continue</SplitButton>
  )
}

function Configure({ provider: { validate, initialValues, id, Options }, setConfig }: { provider: provider, setConfig(config: object): void }) {
    const form = useForm<{}>({ validate, initialValues });
    const save = () => post().then(()=>setConfig({ ...form.values, id }));
    const force = () => setConfig({ ...form.values, id });
    const { data: valid, post, error, loading } = useAPI({ url: `/connector/validate`, form, data: { id }, schema: true, });
    return <>
        {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
        {!!valid&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">Validated successfully.</Alert>}
        <TextInput withAsterisk mb="xs"
            label="Connector Name"
            placeholder="name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            {...form.getInputProps('name')}
        />
        <Options form={form} />
        <Group mt="xs" justify="flex-end"><ActionButton loading={loading} save={save} validate={post} force={force} /></Group>
    </>

}

function Content({ connector, refresh, adding }: { connector: Connector, refresh(): void, adding: boolean }) {
    const theme = useMantineTheme();
    const [active, setActive] = useState<number>(0);
    const [config, setConfig] = useState<object>(connector);
    const [provider, setProvider] = useState<provider|undefined>(undefined);
    const useConfig = (data: object) => { setConfig(data); setActive(2); }
    return (
    <Wrapper>
      <Stepper size="sm" active={active} onStepClick={setActive} >
        <Stepper.Step label="Select Provider" >
            <SimpleGrid cols={2} mt="md">{providers.map(p=>
                <UnstyledButton onClick={()=>{ setProvider(p); setActive(1); setConfig(connector); }} key={p.id} className={classes.item} >
                    <p.Icon size={32} color={theme.colors[p.color][6]} />
                    <Text size="xs" mt={5} >{p.name}</Text>
                </UnstyledButton>)}
            </SimpleGrid>
        </Stepper.Step>
        <Stepper.Step label="Configure" allowStepSelect={!!config} >
          {provider&&<Configure provider={provider} setConfig={useConfig} />}
        </Stepper.Step>
        <Stepper.Step label="Select Headers" allowStepSelect={false} >
        {!!config&&<Headers/>}
        </Stepper.Step>
        <Stepper.Completed>
          Completed, click back button to get to previous step
        </Stepper.Completed>
      </Stepper>
    </Wrapper>
    )
}

export default function Editor({ editing, close, refresh }: { editing?: [Connector,boolean], close(): void, refresh(): void }) {
    const adding = (editing && editing[0] && !editing[1]) || false ;
    return (
      <Modal size="lg" opened={!!editing} onClose={close} styles={{content:{background:"none"},header:{background:"none"}}} closeOnClickOutside={false} >
        {editing&&<Content connector={editing[0]} refresh={refresh} adding={adding} />}
      </Modal>
    );
  }