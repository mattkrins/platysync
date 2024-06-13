import { TextInput, Button, Container, Paper, Title, Group, Text } from "@mantine/core";
import { useForm, isNotEmpty } from "@mantine/form";
import classes from './Setup.module.css';
import useAPI from "../../hooks/useAPI";
import { useLocation } from "wouter";
import { onKeyUp } from "../../modules/common";
import NewSchema from "../../components/NewSchema";

export default function CreateSchema() {
    const [_, setLocation] = useLocation();
    const form = useForm({
        initialValues: { name: '' },
        validate: {
            name: isNotEmpty('Schema name can not be empty.'),
        },
    });

    const { post, loading } = useAPI( {
        url: "/api/v1/schema", form,
        then: () => setLocation('/setup/3'),
    } );

    const submit = () => post();

    return (
      <Container size={400} my={20}>
        <Title ta="center" className={classes.title}>Let&apos;s Begin!</Title>
        <Text size="sm" ta="center">Step 2 of 2</Text>
        <Text c="dimmed" size="sm" ta="center">Create an initial schema</Text>
        <Paper className={classes.box} withBorder shadow="md" p="lg" mt="xs" radius="md">
          <NewSchema/>
        </Paper>
      </Container>
    );
}