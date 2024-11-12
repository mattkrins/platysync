import { ActionIcon, ButtonGroup, TextInput, TextInputProps } from '@mantine/core';
import { useTemplater } from '../context/TemplateContext';
import { IconCode } from '@tabler/icons-react';
import { ChangeEvent, useCallback, useRef, useState } from 'react';

interface ExtTextInput extends TextInputProps {
  rightSection?: JSX.Element[];
  rule?: Rule;
}

export default function ExtTextInput({ rightSection: buttons, disabled, rule, ...props }: ExtTextInput) {
  const extProps: { error?: string } = {};
  const ref = useRef<HTMLInputElement>(null);
  const [ value, setValue ] = useState<string>(props.value as string||"");
  const { open, validate } = useTemplater();
  const error = useCallback(() => validate(value, rule),[ value, rule ]);
  if (error()) extProps.error = error();
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (props.onChange) props.onChange(event);
    setValue(ref.current?.value||"");
  }
  const rightSection = (
  <ButtonGroup mr={buttons?buttons.length*28:undefined} >
    {buttons&&(buttons.map(x=>x))}
    <ActionIcon disabled={disabled} variant="subtle" onClick={()=>open({input: ref.current, rule})} ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }}/></ActionIcon>
  </ButtonGroup>);
  return <TextInput ref={ref} {...props} onChange={onChange} disabled={disabled} rightSection={rightSection} {...extProps} />
}
