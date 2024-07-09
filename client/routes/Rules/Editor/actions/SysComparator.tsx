import { SimpleGrid, Switch, TextInput, Textarea } from '@mantine/core';
import { actionOptions } from '../../../../modules/actions'
import Conditions from '../Conditions'
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { IconBraces, IconCheck, IconX } from '@tabler/icons-react';

export default function SysComparator( { form, path, templateProps }: actionOptions ) {
    const conditions = form.getInputProps(`${path}.conditions`).value;
    const output = form.getInputProps(`${path}.output`).value;
    const initialValues = {conditions: conditions||[]} as unknown as Rule;
    const form2 = useForm({ initialValues, validate: {} });

    useEffect(() => {
        form.setFieldValue(`${path}.conditions`, form2.values.conditions)
    }, [JSON.stringify(form2.values.conditions)]);
    return (
    <>
        <Conditions form={form2} label="This action can halt futher execution, or build conditional templates." compact />
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
            <SimpleGrid>
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
