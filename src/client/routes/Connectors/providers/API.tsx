import { TextInput, Select, Anchor, JsonInput, Checkbox, NumberInput } from "@mantine/core";
import { IconArrowRight, IconClock, IconRoute2, IconSlash, IconWorld } from "@tabler/icons-react";
import Concealer from "../../../components/Concealer";
import { UseFormReturnType } from "@mantine/form";
import { config } from "process";
import SecurePasswordInput from "../../../components/SecurePasswordInput";
import usePassword from "../../../hooks/usePassword";

const authMethods = [
    { label: 'Basic', value: 'basic' },
    { label: 'Bearer Token', value: 'bearer' },
];

export default function API( { form, path }: { form: UseFormReturnType<Connector>, path?: string } ) {
    const method: string = form.getInputProps(`${path}method`).value;
    const { visible, options, secure, unlock } = usePassword(form, `${path}password`);
    const auth = form.getInputProps(`${path}auth`);
    return (
    <>
        <TextInput
            label="API endpoint URL" mt="md"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="https://service.com/api/v1"
            withAsterisk
            {...form.getInputProps(`${path||''}endpoint`)}
        />
        <TextInput
            label="API target" mt="md" description="Appended onto endpoint URL."
            leftSection={<IconArrowRight size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="/users"
            {...form.getInputProps(`${path||''}target`)}
        />
        <Select mt="xs" label="Authentication"
            description={<>
            Method used to <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication" >authenticate</Anchor> the request.
            </>}
            {...form.getInputProps(`${path||''}auth`)}
            placeholder={"None"}
            data={authMethods}
        /> {auth.value&&
        <SecurePasswordInput mt="xs" withAsterisk={!config}
            label="Password" 
            placeholder={auth.value==="basic"?"username:password":"secret"}
            visible={visible}
            secure={secure}
            unlock={unlock}
            rightSectionX={options.buttons}
            {...form.getInputProps(`${path||''}password`)}
        />}
        <NumberInput mt="xs"
            label="Caching Policy"
            description="Cache data and hold for x minutes."
            leftSection={<IconClock size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="0"
            min={1}
            {...form.getInputProps(`${path||''}cache`)}
        />
        <Concealer>
            <Select mt="xs" label="Method"
                description={<>
                Method used to <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods" >send</Anchor> the request.
                </>}
                placeholder="get"
                {...form.getInputProps(`${path||''}method`)}
                data={['post']}
            />{method&&
            <JsonInput mt="xs" autosize
            label="Body Data" description="JSON data to send in the request."
            placeholder='{"name":"John", "age":30, "car":null}'
            {...form.getInputProps(`${path||''}sendData`)}
            />}
            <TextInput
                label="Iterative Data Path" mt="xs" description="Response JSON path which holds array of object data"
                leftSection={<IconRoute2 size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="data.users"
                {...form.getInputProps(`${path||''}responsePath`)}
            />
            <Checkbox mt="md" label="Page with header links" {...form.getInputProps(`${path||''}linkHeader`, { type: 'checkbox' })}
            description={<>
                Data is paged by the <Anchor size="xs" target="_blank" href="https://www.w3.org/Protocols/9707-link-header.html" >linked resources</Anchor> standard.
            </>}
            />
        </Concealer>
    </>);
}
