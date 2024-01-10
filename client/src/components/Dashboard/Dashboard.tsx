import { Text } from '@mantine/core'
import Head from "../Common/Head";
import ActionButton from "./ActionButton";
import Container from "../Common/Container";
import Finder, { match } from "../Rules/RunModal/Finder";
import useAPI from "../../hooks/useAPI";
import { useState } from "react";

export default function Dashboard() {

    const { get: getSchemas, data: schemas, loading: l2 } = useAPI({
        url: "/schema",
        default: [ { onClick:()=>setSchema('all schemas'), label: 'All Schemas'} ],
        fetch: true,
        mutate: (schemas: Schema[]) => {
            const list = schemas.map(s=>({  onClick:()=>setSchema(s.name), label: s.name }));
            return [{ onClick:()=>setSchema('all schemas'), label: 'All Schemas'}, ...list ]
        },
    });

    const [ schema, _schema ] = useState<string>('all schemas');
    
    const { data: matches, post, loading: l1, reset: r1, setData: _matches } = useAPI({
        url: `/match`,
        data: {schema_name: schema},
        mutate: (matches=>matches.filter((c: match)=>c.actionable))
    });

    const loading = l1||l2;
    const haveSchema = schemas.length>1;

    const setSchema = (s: string) => {
        _schema(s);
        r1();
    }

    return (
        <Container size="responsive"
        label={<Head rightSection={!haveSchema?<></>:<ActionButton  schema={schema} schemas={schemas} setSchema={setSchema} getSchemas={getSchemas} check={post} loading={loading} />}
        >Dashboard</Head>}
        >
            {haveSchema?<>
            <Finder matches={matches||[]} loading={l1} setData={_matches} run={()=>{}} dash  />
            {(!matches&&!l1)&&<Text fz="sm" c="dimmed" >Run a <a href="#" onClick={post} >check</a> to find actions to take.</Text>}
            </>:<Text fz="sm" c="dimmed" >Create a schema to begin.</Text>}
        </Container>
    )
}
