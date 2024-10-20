import { ActionIcon, ButtonGroup, TextInput, TextInputProps } from '@mantine/core';
import { useTemplater } from '../context/TemplateContext';
import { IconCode } from '@tabler/icons-react';
import { useCallback, useRef, useState } from 'react';
import useTemplate from '../hooks/useTemplate';

interface ExtTextInput extends TextInputProps {
  rightSection?: JSX.Element[];
}

export default function ExtTextInput({ rightSection: buttons, ...props }: ExtTextInput) {
  const extProps: { error?: string } = {};
  const ref = useRef<HTMLInputElement>(null);
  const [ value, setValue ] = useState<string>("");
  const { open } = useTemplater();
  const { validate } = useTemplate({});
  const update = ()=> setValue(ref.current?.value||"");
  const error = useCallback(() => validate(value),[ value ]);
  if (error()) extProps.error = error();
  const rightSection = (
  <ButtonGroup mr={buttons?buttons.length*28:undefined} >
    {buttons&&(buttons.map(x=>x))}
    <ActionIcon variant="subtle" onClick={()=>open(ref.current)} ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }}/></ActionIcon>
  </ButtonGroup>);
  return <TextInput ref={ref} {...props} rightSection={rightSection} onClick={update} onKeyUp={update} {...extProps} />
}
