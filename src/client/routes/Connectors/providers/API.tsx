import { TextInput, Select, Anchor, JsonInput, Checkbox, NumberInput } from "@mantine/core";
import { IconArrowRight, IconClock, IconRoute2, IconSlash, IconWorld } from "@tabler/icons-react";
import Concealer from "../../../components/Concealer";
import { UseFormReturnType } from "@mantine/form";
import { config } from "process";
import SecurePasswordInput from "../../../components/SecurePasswordInput";
import usePassword from "../../../hooks/usePassword";
import { providerConfig } from "../../../modules/providers";

const authMethods = [
    { label: 'Basic', value: 'basic' },
    { label: 'Bearer Token', value: 'bearer' },
];

export default function API( { props }: providerConfig ) {
    const method: string = props("method").value;
    const auth: string = props("auth").value;
    return (
    <>
        <TextInput
            label="API endpoint URL" mt="md"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="https://service.com/api/v1"
            withAsterisk
            {...props("endpoint")}
        />
        <TextInput
            label="API target" mt="md" description="Appended onto endpoint URL."
            leftSection={<IconArrowRight size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="/users"
            {...props("target")}
        />
        <Select mt="xs" label="Authentication"
            description={<>
            Method used to <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication" >authenticate</Anchor> the request.
            </>}
            {...props("auth")}
            placeholder={"None"}
            data={authMethods}
        /> {auth&&
        <SecurePasswordInput mt="xs" withAsterisk={!config}
            label="Password"
            {...props("password", { type: "password", placeholder: auth==="basic"?"username:password":"secret" })}
        />}
        <NumberInput mt="xs"
            label="Caching Policy"
            description="Cache data and hold for x minutes."
            leftSection={<IconClock size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="0"
            min={1}
            {...props("cache")}
        />
        <Concealer>
            <Select mt="xs" label="Method"
                description={<>
                Method used to <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods" >send</Anchor> the request.
                </>}
                placeholder="get"
                {...props("method")}
                data={['post']}
            />{method&&
            <JsonInput mt="xs" autosize
            label="Body Data" description="JSON data to send in the request."
            placeholder='{"name":"John", "age":30, "car":null}'
            {...props("sendData")}
            />}
            <TextInput
                label="Iterative Data Path" mt="xs" description="Response JSON path which holds array of object data"
                leftSection={<IconRoute2 size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="data.users"
                {...props("responsePath")}
            />
            <Checkbox mt="md" label="Page with header links" {...props("linkHeader", { type: 'checkbox' })}
            description={<>
                Data is paged by the <Anchor size="xs" target="_blank" href="https://www.w3.org/Protocols/9707-link-header.html" >linked resources</Anchor> standard.
            </>}
            />
        </Concealer>
    </>);
}
