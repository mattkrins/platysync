import { Container, Paper, Title, Text } from "@mantine/core";
import classes from './Setup.module.css';
import NewSchema from "../../../components/NewSchema";
import { useDispatch } from "../../../hooks/redux";
import { loadApp } from "../../../providers/appSlice";

export default function CreateSchema() {
  const dispatch = useDispatch();
  return (
    <Container size={400} my={20}>
      <Title ta="center" className={classes.title}>Let&apos;s Begin!</Title>
      <Text size="sm" ta="center">Step 2 of 2</Text>
      <Text c="dimmed" size="sm" ta="center">Create an initial schema</Text>
      <Paper className={classes.box} withBorder shadow="md" p="lg" mt="xs" radius="md">
        <NewSchema then={()=>dispatch(loadApp())} />
      </Paper>
    </Container>
  );
}