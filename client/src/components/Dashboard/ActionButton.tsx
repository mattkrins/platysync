import SplitButton from '../Common/SplitButton';

interface Props {
    schema: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schemas: any;
    getSchemas(): void;
    setSchema(s:string): void;
    check(): void;
    loading: boolean;
}
export default function ActionButton({ schema, schemas, check, loading, getSchemas }: Props) {
    return (<>
        <SplitButton menu={{onOpen:()=>getSchemas()}} loading={loading} variant="light" onClick={check} options={schemas} >Check {schema}</SplitButton>
    </>);
}