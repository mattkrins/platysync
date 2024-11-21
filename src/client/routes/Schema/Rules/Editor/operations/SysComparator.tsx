import { SimpleGrid, Switch, TextInput, Textarea, TextareaProps } from '@mantine/core';
import { IconBraces, IconCheck, IconX } from '@tabler/icons-react';
import { operationProps } from '../operations';
import Conditions from '../../../../../components/Conditions';
import ExtTextInput from '../../../../../components/ExtTextInput';

export default function SysComparator( { props, rule, form, blueprint }: operationProps ) {
    const output = props(`output`).value;
    return (
    <>
        <Conditions form={form} rule={rule} label="This action can halt futher execution, or build conditional templates." compact />
        <Switch mt="xs" mb="xs"
        label="Output result to template"
        description={output?undefined:"Execution will currently be halted if conditions do not pass."}
        {...props("output", { type: 'checkbox' })}
        />
        {output&&<>
            <ExtTextInput rule={rule} withAsterisk={!blueprint?.key}
                label="Template Key"
                description="Template key will contain output string based on conditions evaluating."
                leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                placeholder="result"
                {...props("key")}
            />
            <SimpleGrid cols={2} pt="xs" >
                <ExtTextInput<TextareaProps> Component={Textarea} rule={rule} withAsterisk={!blueprint?.key}
                    placeholder="true"
                    autosize maxRows={4}
                    leftSection={<IconCheck size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    {...props("true")}
                />
                <ExtTextInput<TextareaProps> Component={Textarea} rule={rule} withAsterisk={!blueprint?.key}
                    placeholder="false"
                    autosize maxRows={4}
                    leftSection={<IconX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    {...props("false")}
                />
            </SimpleGrid>
        </>}
    </>
  )
}
