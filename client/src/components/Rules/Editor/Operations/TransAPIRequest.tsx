import { Anchor, Box, Input, JsonInput, SegmentedControl, TextInput, Textarea } from "@mantine/core";
import { IconBraces, IconCloudComputing, IconWorld } from "@tabler/icons-react";
import SelectConnector from "../../../Common/SelectConnector";

const xml = `<user>
  <name>John</name>
  <age>30</age>
</user>`

export default function TransAPISend( { form, index, templateProps, actionType, templates }: ActionItem ) {
    return (
        <Box p="xs" pt={0} >
            <SelectConnector
                label="Base Endpoint" withAsterisk
                clearable type="api"
                leftSection={<IconCloudComputing size="1rem" />}
                {...form.getInputProps(`${actionType}.${index}.source`)}
            />
            <TextInput
                label="Target Endpoint URL" mt="md"
                description="Appended to the base API URL."
                leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="/user/add"
                withAsterisk
                {...templateProps(form, `${actionType}.${index}.target`, templates)}
            />
            <Input.Wrapper mt="xs" withAsterisk
            label="Method"
            description={<>
                <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods" >HTTP Method</Anchor> to use for request.
                </>}
            >
            <SegmentedControl fullWidth mt={5}
            {...form.getInputProps('method')}
            defaultValue="get"
            data={[
            { label: 'GET', value: 'get' },
            { label: 'POST', value: 'post' },
            { label: 'PUT', value: 'put' },
            { label: 'DELETE', value: 'delete' },
            ]} />
            </Input.Wrapper>
            {form.values.method!=="get"&&<>
            <Input.Wrapper mt="xs" withAsterisk
            label="Data Type"
            description={<>
            <Anchor size="xs" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST" >Content-Type</Anchor> of the body data.
            </>}
            >
            <SegmentedControl fullWidth mt={5}
            {...form.getInputProps('mime')}
            defaultValue="json"
            data={[
            { label: 'JSON', value: 'json' },
            { label: 'TEXT', value: 'text' },
            { label: 'FORM', value: 'form' },
            { label: 'XML', value: 'xml' },
            ]} />
            </Input.Wrapper>
            {form.values.mime==="json"?
            <JsonInput mt="xs" autosize
                label="Body Data"
                placeholder='{"name":"John", "age":30, "car":null}'
                {...templateProps(form, `${actionType}.${index}.data`, templates)}
            />:form.values.mime==="form"?<></>:
            <Textarea mt="xs" autosize
                label="Body Data"
                placeholder={form.values.mime==="xml"?xml:`Hello World`}
                {...templateProps(form, `${actionType}.${index}.data`, templates)}
            />
            }
            </>}
            <TextInput
                label="Template Key" mt="xs"
                description="Set to store returned / response data in this template key."
                placeholder="response"
                leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                {...templateProps(form, `${actionType}.${index}.response`, templates)}
            />
        </Box>
        )
}
