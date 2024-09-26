import { Button, Container, Group, Title, Text, Anchor } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useLoader, useSelector } from "../../../hooks/redux";
import { getConnectors } from "../../../providers/schemaSlice";
import Wrapper from "../../../components/Wrapper";
import useEditor from "../../../hooks/useEditor";

export default function Dictionary() {
  const { loadingConnectors: loading } = useLoader();
  const entries = useSelector(getConnectors);
  const [ file, editing, { add, close, edit } ] =  useEditor<psFile>({ name: "", key: "" });
  return (
    <Container>
        <Group justify="space-between">
            <Title mb="xs" >Dictionary</Title>
            <Button onClick={()=>add()} loading={loading} leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper loading={loading} >
          {entries.length<=0&&<Text c="dimmed" >No files in schema. <Anchor onClick={()=>add()} >Add</Anchor> static files for use in templating.</Text>}
        </Wrapper>
    </Container>
  )
}
