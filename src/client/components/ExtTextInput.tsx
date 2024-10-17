import { ActionIcon, ButtonGroup, TextInput, TextInputProps } from '@mantine/core';
import { useTemplate } from '../context/TemplateContext';
import { IconCode } from '@tabler/icons-react';
import { useRef } from 'react';

interface ExtTextInput extends TextInputProps {
  rightSection?: JSX.Element[];
}

export default function ExtTextInput({ rightSection: buttons, ...props }: ExtTextInput) {
  const ref = useRef<HTMLInputElement>(null);
  const { open, setInput } = useTemplate();
  const onClick = () => {
    if (ref.current) setInput(ref.current);
    open();
  };
  const rightSection = <ButtonGroup mr={buttons?buttons.length*28:undefined} >
    {buttons&&(buttons.map(x=>x))}
    <ActionIcon variant="subtle" onClick={onClick} ><IconCode size={16} style={{ display: 'block', opacity: 0.8 }}/></ActionIcon>
  </ButtonGroup>
  return <TextInput ref={ref} {...props} rightSection={rightSection} />
}
