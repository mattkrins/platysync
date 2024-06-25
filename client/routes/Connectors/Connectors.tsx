import { Button, Container, Group, Title } from "@mantine/core";
import Wrapper from "../../components/Wrapper";
import { IconPlus } from "@tabler/icons-react";

export default function Connectors() {
    return (
    <Container>
        <Group justify="space-between">
            <Title mb="xs" >Connector Manager</Title>
            <Button leftSection={<IconPlus size={18} />} >Add</Button>
        </Group>
        <Wrapper >
            Connectors
        </Wrapper>
    </Container>
    )
}
