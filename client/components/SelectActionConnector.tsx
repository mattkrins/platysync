import { useEffect, useMemo } from 'react';
import SelectConnector, { SelectConnectorProps } from './SelectConnector'
import { UseFormReturnType } from '@mantine/form';
import { useConnectors } from '../hooks/redux';

interface SelectActionConnectorProps extends SelectConnectorProps {
    form: UseFormReturnType<Rule, (values: Rule) => Rule>;
    path: string;
}

export default function SelectActionConnector( { form, path, ...props}: SelectActionConnectorProps ) {
    const { proConnectors } = useConnectors();
    const ruleProConnectors = useMemo(()=>{
        let context = proConnectors;
        if (props.names) context.filter(c=>props.names&&props.names.includes(c.name));
        if (props.ids) context = context.filter(c=>props.ids&&props.ids.includes(c.id));
        return context;
    }, [ proConnectors, props.names, props.ids ]);
    useEffect(()=>{
        if (props.value) return;
        if (!ruleProConnectors) return;
        form.setFieldValue(path, ruleProConnectors[0].name);
    },[]);
    return <SelectConnector {...props} />;
}
