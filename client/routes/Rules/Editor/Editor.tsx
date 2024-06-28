import { Container, Group, Title, Anchor, useMantineTheme } from "@mantine/core";
import { IconPackageExport, IconPackageImport, IconTestPipe, IconX } from "@tabler/icons-react";
import Wrapper from "../../../components/Wrapper";
import { useLocation } from "wouter";
import SplitButton from "../../../components/SplitButton";
import { isNotEmpty, useForm } from "@mantine/form";
import useAPI from "../../../hooks/useAPI";

const validate = {
    name: isNotEmpty('Name must not be empty.'),
}

function ActionButton( { loading, save, test }: { loading?: boolean, save(): void, test(): void } ) {
  const theme = useMantineTheme();
  return (
    <SplitButton loading={loading} onClick={save} options={[
      {  onClick:()=>test(), label: 'Test', leftSection: <IconTestPipe size={16} color={theme.colors.grape[5]}  /> },
      {  onClick:()=>save(), label: 'Export', leftSection: <IconPackageExport size={16} color={theme.colors.green[5]}  /> },
      {  onClick:()=>save(), label: 'Import', leftSection: <IconPackageImport size={16} color={theme.colors.orange[5]}  /> },
      {  onClick:()=>save(), label: 'Cancel', leftSection: <IconX size={16} color={theme.colors.red[5]}  /> },
      ]} >Save</SplitButton>
  )
}

export default function Editor({ editing, close }: { editing: [Rule,boolean], close(): void }) {
    const [_, setLocation] = useLocation();
    const form = useForm<psFile>({ validate, initialValues: structuredClone(editing[0]) });
    const adding = (editing && editing[0] && !editing[1]) || false ;
    const { post: test } = useAPI<boolean>({
        url: `/rule/execute?test=true`, form,
    });
    return (
    <Container>
        <Group justify="space-between">
            <Title mb="xs" ><Title mb="xs" onClick={()=>setLocation("/")} component={Anchor} >Rules</Title> / Rule - {adding?'New':'Edit'}</Title>
            <ActionButton save={()=>{}} test={()=>test()} />
        </Group>
        <Wrapper>
            {JSON.stringify(editing)}
        </Wrapper>
    </Container>
    )
}