import SplitButton from '../Common/SplitButton';
import useAPI from '../../hooks/useAPI';

interface Props {
    schema: string;
    setSchema(s:string): void;
    check(): void;
    loading: boolean;
}
export default function ActionButton({ schema, setSchema, check, loading: l1 }: Props) {
    const { data: schemas, loading: l2 } = useAPI({
        url: "/schema",
        default: [ { onClick:()=>setSchema('all schemas'), label: 'All Schemas'} ],
        fetch: true,
        mutate: (schemas: Schema[]) => {
            const list = schemas.map(s=>({  onClick:()=>setSchema(s.name), label: s.name }));
            return [{ onClick:()=>setSchema('all schemas'), label: 'All Schemas'}, ...list ]
        },
    });
    const loading = l1||l2;
    return (<>
        <SplitButton loading={loading} variant="light" onClick={check} options={schemas} >Check {schema}</SplitButton>
    </>);
}