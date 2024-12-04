/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionIcon, ButtonGroup, MantineComponent, TextInput, TextInputProps } from '@mantine/core';
import { useTemplater } from '../context/TemplateContext';
import { IconCode } from '@tabler/icons-react';
import { ChangeEvent, useCallback, useRef, useState } from 'react';

export type ExtTextInput<x=TextInputProps> = x & {
  Component?(x: any): MantineComponent<any>;
  rightSection?: JSX.Element[];
  rule?: Rule;
  scope?: string;
  disabled?: boolean;
  onChange(e: ChangeEvent<HTMLInputElement>): void;
  value?: any;
}

export default function ExtTextInput<x=TextInputProps>({ Component, rightSection: buttons, disabled, rule, scope, ...props }: ExtTextInput<x>) {
  const extProps: { error?: string } = {};
  const ref = useRef<HTMLInputElement>(null);
  const [ value, setValue ] = useState<string>(props.value as string||"");
  const { open, validate } = useTemplater();
  const error = useCallback(() => validate(value, rule, scope),[ value, rule ]);
  if (error()) extProps.error = error();
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (props.onChange) props.onChange(event);
    setValue(ref.current?.value||"");
  }
  const Element = Component||TextInput;
  const rightSection = (
  <ButtonGroup mr={buttons?buttons.length*28:undefined} >
    {buttons&&(buttons.map(x=>x))}
    <ActionIcon disabled={disabled} variant="subtle" onClick={()=>open({input: ref.current, rule, scope})} ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }}/></ActionIcon>
  </ButtonGroup>);
  return <Element ref={ref} {...props} onChange={onChange} disabled={disabled} rightSection={rightSection} {...extProps} />
}
