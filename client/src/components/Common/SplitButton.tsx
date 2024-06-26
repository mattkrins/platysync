import { Button, Menu, Group, ActionIcon, rem } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import classes from './SplitButton.module.css';

interface Props {
    children: React.ReactNode;
    variant?: string;
    onClick?: ()=>void;
    loading?: boolean;
    menu?: object;
    buttonDisabled?: boolean;
    leftSection?: React.ReactNode;
    options: {
      leftSection?: React.ReactNode;
      rightSection?: React.ReactNode;
      onClick?: (label: string)=>void;
      label: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [any: string]: any,
    }  [];
}
export default function SplitButton( { children, options = [], onClick, loading, menu, variant, buttonDisabled }: Props ) {
  return (
    <Group wrap="nowrap" gap={0}>
      <Button variant={variant} disabled={buttonDisabled} loading={loading} onClick={onClick} className={classes.button}>{children}</Button>
      <Menu disabled={loading} transitionProps={{ transition: 'pop' }} position="bottom-end" {...menu} withinPortal>
        <Menu.Target>
          <ActionIcon variant={variant}
            size={36}
            className={classes.menuControl}
          >
            <IconChevronDown style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          {options.map(({label, onClick, ...props}, i)=> <Menu.Item key={i} onClick={onClick?()=>{ onClick(label) }:undefined} {...props}>{label}</Menu.Item> )}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}