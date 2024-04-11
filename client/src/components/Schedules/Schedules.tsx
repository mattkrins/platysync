import { Box, Button, Grid, LoadingOverlay, Paper } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import Head from "../Common/Head";
import Container from "../Common/Container";
import useAPI from "../../hooks/useAPI";

export default function Schedules() {

    const { data: schedules, loading } = useAPI<schedule[]>({
        url: `/schedule`,
        default: [],
        fetch: true,
    });

    return (
    <Container label={<Head rightSection={<Button leftSection={<IconPlus size={16} />} loading={loading} variant="light">Add</Button>} >File Manager</Head>} >
        {schedules.length>0?
        <Box>
            <Paper mb="xs" p="xs" >
                <Grid justify="space-between">
                    <Grid.Col span={2}/>
                    <Grid.Col span={4}>Display</Grid.Col>
                    <Grid.Col span={4}>Data</Grid.Col>
                    <Grid.Col span={2}/>
                </Grid>
            </Paper>
        </Box>:
        <Paper withBorder p="lg" pos="relative" >
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 1 }} />
            No Schedules in effect.<br/>Automate rule processing by adding a schedule.
        </Paper>}
    </Container>
    )
}
