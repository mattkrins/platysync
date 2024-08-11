import { SimpleGrid, Switch, TextInput, Textarea } from '@mantine/core';
import { IconBraces, IconCheck, IconX } from '@tabler/icons-react';
import { actionProps } from '../../../../modules/actions'
import Conditions from '../Conditions'

export default function SysComparator( { form, path, templateProps, iterative }: actionProps ) {
    const output = form.getInputProps(`${path}.output`).value;
    return (
    <>
        <Conditions iterative={iterative} form={form} path={`${path}.conditions`} label="This action can halt futher execution, or build conditional templates." compact />
        <Switch label="Output result to template"
        description={output?undefined:"Execution will currently be halted if conditions do not pass."}
        mt="xs" mb="xs" {...form.getInputProps(`${path}.output`, { type: 'checkbox' })}
        /> {output&&
        <>
            <TextInput
                label="Template Key" withAsterisk
                description="Template key will contain output string based on conditions evaluating."
                placeholder="result"
                leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                {...templateProps(form, `${path}.key`)}
            />
            <SimpleGrid cols={2} pt="xs" >
                <Textarea
                    placeholder="true"
                    autosize maxRows={4}
                    leftSection={<IconCheck size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    {...templateProps(form, `${path}.true`)}
                />
                <Textarea
                    placeholder="false"
                    autosize maxRows={4}
                    leftSection={<IconX size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    {...templateProps(form, `${path}.false`)}
                />
            </SimpleGrid>
        </>}
    </>
  )
}
