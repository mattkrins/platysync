import { TextInput, Select, Anchor, JsonInput } from "@mantine/core";
import { IconWorld } from "@tabler/icons-react";
import Concealer from "../../../components/Concealer";
import { UseFormReturnType } from "@mantine/form";
import { config } from "process";
import SecurePasswordInput from "../../../components/SecurePasswordInput";
import usePassword from "../../../hooks/usePassword";

const authMethods = [
    { label: 'Basic', value: 'basic' },
    { label: 'Bearer Token', value: 'bearer' },
];

export default function API( { form }: { form: UseFormReturnType<Connector> } ) {
    const method: string = form.getInputProps(`method`).value;
    const { visible, options, secure, unlock } = usePassword(form, `password`);
    const auth = form.getInputProps(`auth`);
    return (
    <>
        <TextInput
            label="API endpoint URL" mt="md"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="https://service.com/api/v1"
            withAsterisk
            {...form.getInputProps('endpoint')}
        />
        <TextInput
            label="Iterative Data Path" mt="xs" description="Response JSON path which holds array of object data"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="https://service.com/api/v1"
            withAsterisk
            {...form.getInputProps('endpoint')}
        />
        <Select mt="xs" label="Authentication"
            description={<>
            Method used to <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication" >authenticate</Anchor> the request.
            </>}
            {...form.getInputProps(`auth`)}
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
            {...form.getInputProps('password')}
        />}
        <Concealer>
            <Select mt="xs" label="Method"
                description={<>
                Method used to <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods" >send</Anchor> the request.
                </>}
                placeholder="get"
                {...form.getInputProps(`method`)}
                data={['post']}
            />{method&&
            <JsonInput mt="xs" autosize
            label="Body Data" description="JSON data to send in the request."
            placeholder='{"name":"John", "age":30, "car":null}'
            {...form.getInputProps(`data`)}
            />}
        </Concealer>
    </>);
}
