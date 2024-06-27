import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { ActionIcon, Tooltip, ActionIconProps, TooltipProps } from '@mantine/core';
import { Icon, IconProps } from '@tabler/icons-react';

interface Props extends ActionIconProps {
    label?: string;
    error?: string;
    reset?(): void;
    onClick?(): void;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    tooltip?: TooltipProps;
    icon?: IconProps;
}
export default function MenuTip( { label, error, color, reset, Icon, tooltip, icon, ...props  }: Props ) {
    return (
    <Tooltip style={{zIndex:100}} label={error||label} opened={!!error ? true : !!label?undefined:false} color={error ? "red" : color } zIndex={100} {...tooltip} >
        <ActionIcon onMouseEnter={!!error?reset:undefined} color={color} {...props} >
            <Icon size={16} stroke={1.5} {...icon} />
        </ActionIcon>
    </Tooltip>
    )
}
