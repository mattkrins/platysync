import { ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react';
import { Box, UnstyledButton, Group, Collapse, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Icon, IconChevronRight, IconProps } from '@tabler/icons-react';

interface Props {
    children: ReactNode;
    label?: string;
    rightSection?: ReactNode;
    open?: boolean;
    Icon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    [k: string]: unknown;
}
export default function Concealer( { children, label = 'Advanced', rightSection, open = false, Icon = IconChevronRight, ...props  }: Props ) {
    const [opened, { toggle }] = useDisclosure(open);
    return (
    <Box>
        <Group justify='space-between' grow >
            <UnstyledButton mt={10} onClick={toggle} >
                <Group gap={2}>
                    <Text {...props} >{label}</Text>
                    <Icon
                    size={14}
                    style={{transform: opened ? `rotate(${90}deg)` : 'none',}}
                    />
                </Group>
            </UnstyledButton>
            {rightSection}
        </Group>
        <Collapse in={opened}>
            {children}
        </Collapse>
    </Box>
    )

}
