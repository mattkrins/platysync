import { Text } from '@mantine/core'
import Head from "../Common/Head";
import ActionButton from "./ActionButton";
import Container from "../Common/Container";
import Finder, { match } from "../Rules/RunModal/Finder";
import useAPI from "../../hooks/useAPI";
import { useState } from "react";

export default function Dashboard() {

    const [ schema, _schema ] = useState<string>('all schemas');
    
    const { data: matches, post, loading, reset: r1, setData: _matches } = useAPI({
        url: `/match`,
        data: {schema_name: schema},
        mutate: (matches=>matches.filter((c: match)=>c.actionable))
    });

    const setSchema = (s: string) => {
        _schema(s);
        r1();
    }

    return (
        <Container size="responsive" label={<Head rightSection={<ActionButton  schema={schema} setSchema={setSchema} check={post} loading={loading} />} >Dashboard</Head>} >
            <Finder matches={matches||[]} loading={loading} setData={_matches} run={()=>{}} dash  />
            {(!matches&&!loading)&&<Text fz="sm" c="dimmed" >Run a <a href="#" onClick={post} >check</a> to find actions to take.</Text>}
        </Container>
    )
}
