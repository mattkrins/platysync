import { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';
import { Box, UnstyledButton, Group, Collapse, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Icon, IconChevronRight, IconProps } from '@tabler/icons-react';

interface Props {
    children: ReactNode;
    label?: string|ReactNode;
    rightSection?: ReactNode;
    open?: boolean;
    isOpen?: boolean;
    onClick?(): void;
    Icon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    [k: string]: unknown;
}
export default function Concealer( { children, label = 'Advanced', onClick, isOpen, rightSection, open = false, Icon = IconChevronRight, ...props  }: Props ) {
    const [opened, { toggle }] = useDisclosure(open);
    return (
    <Box>
        <Group justify='space-between' grow >
            <UnstyledButton mt={10} onClick={onClick?()=>onClick():toggle} >
                <Group gap={2}>
                    <Text {...props} >{label}</Text>
                    <Icon
                    size={14}
                    style={{transform: (isOpen||opened) ? `rotate(${90}deg)` : 'none',}}
                    />
                </Group>
            </UnstyledButton>
            {rightSection}
        </Group>
        <Collapse in={isOpen||opened}>
            {children}
        </Collapse>
    </Box>
    )

}
