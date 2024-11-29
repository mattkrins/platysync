import { UnstyledButton, Group, Box, useMantineTheme, Collapse, Popover, Button, Text, ButtonProps } from "@mantine/core";
import { useDisclosure, useClickOutside } from "@mantine/hooks";
import { IconProps, Icon, IconChevronRight, IconChevronDown } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes, useMemo } from "react";
import { useSettings } from "../hooks/redux";
import classes from './ActionButton.module.css';
import { availableCategories, availableOperations, operation, operationCategory } from "../routes/Schema/Rules/Editor/operations";

interface SectionProps {
    onClick(): void;
    open?: boolean;
    label: string;
    color?: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    Ricon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
}

function Section({ onClick, open, label, color, Icon, Ricon }: SectionProps ) {
    return (
    <UnstyledButton onClick={onClick} className={classes.connector} p="xs" mt={0} >
        <Group>
            <Box style={{ display: 'flex', alignItems: 'center' }} >
                <Icon size={17} color={color||"grey"} />
            </Box>
            <div style={{ flex: 1 }}><Text size="sm">{label}</Text></div>
            {open!==undefined&&<IconChevronRight size={17} stroke={1.5} style={{transform: open ? `rotate(${90}deg)` : 'none',}} />}
            {Ricon&&<Ricon size={17} stroke={1.5}/>}
        </Group>
    </UnstyledButton>
    )
}

function Category({ category, add, scope }: { category: operationCategory, add(c: operation): void, scope?: string }) {
    const theme = useMantineTheme();
    const [opened, { toggle }] = useDisclosure(false);
    const settings = useSettings();
    const filteredActions = useMemo(()=>availableOperations.
    filter(a=> (a.scope && scope) ? a.scope === scope : true ).
    filter(a=> a.name === "SysRunCommand" ? settings.enableRun : true ).
    filter(a=>a.category===category.id)
    , [ settings.enableRun ]);
    return (
    <>
        <Section open={opened} label={category.name} Icon={category.Icon} onClick={toggle} color={category.color?theme.colors[category.color][6]:undefined} />
        <Collapse in={opened} >
            {filteredActions.map(action=>
            <UnstyledButton onClick={()=>add(action)} p="xs" pt={5} pb={5} pl="md" key={action.name} className={classes.connector}>
                <Group>
                    <Box style={{ display: 'flex', alignItems: 'center' }} >
                        <action.Icon size={17} color={action.color?theme.colors[action.color][6]:undefined} />
                    </Box>
                    <div style={{ flex: 1 }}><Text size="sm">{action.label||action.name}</Text></div>
                </Group>
            </UnstyledButton>)}
        </Collapse>
    </>
    );
}

interface ActionButtonProps extends ButtonProps {
    label: string;
    add(c: operation): void;
    allowedProviders?: string[];
    rightSection?: JSX.Element;
    scope?: string;
}

export default function ActionButton({ label, add, allowedProviders, rightSection, scope,  ...buttonProps }: ActionButtonProps) {
    const [opened, { open, close }] = useDisclosure(false);
    const ref = useClickOutside(() => close());
    const addClose = (c: operation) => { add(c); close(); }
    const filteredCategories = useMemo(()=>{
        if (!allowedProviders) return availableCategories;
        return availableCategories.filter(c=>c.provider?allowedProviders.includes(c.provider):true);
    }, [ allowedProviders ]);
    return (
    <Popover opened={opened} width={300} position="left-start" shadow="md" clickOutsideEvents={['mouseup', 'touchend']}>
        <Popover.Target>
            <Button size="sm" onClick={open} rightSection={rightSection||<IconChevronDown size="1.05rem" stroke={1.5} />} pr={12} {...buttonProps}>{label}</Button>
        </Popover.Target>
        <Popover.Dropdown ref={ref} >
            {filteredCategories.map(category=><Category key={category.name} category={category} add={addClose} scope={scope} />)}
        </Popover.Dropdown>
    </Popover>
    );
}
