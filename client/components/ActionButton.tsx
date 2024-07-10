import { Box, Button, Collapse, Group, Popover, Text, UnstyledButton, useMantineTheme } from "@mantine/core";
import { UseFormReturnType, useForm } from "@mantine/form";
import { useClickOutside, useDisclosure } from "@mantine/hooks";
import classes from './ActionButton.module.css';
import { IconProps, Icon, IconChevronRight, IconChevronDown } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes, useMemo } from "react";
import { availableAction, availableActions, availableCategories, availableCategory } from "../modules/actions";
import { useConnectors, useSettings } from "../hooks/redux";
import { useRule } from "../routes/Rules/Editor/Editor";

//NOTE - do not make target connector avalible if only 1 of type in context
//NOTE - unlock context, enable selecting any connector but additional field target user appears with filter
//NOTE - on server-side, if no target specified, use user in context

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

function Category({ category, add, form }: { category: availableCategory, add(c: availableAction): void, form?: UseFormReturnType<Rule> }) {
    const theme = useMantineTheme();
    const [opened, { toggle }] = useDisclosure(false);
    const form2 = useForm<Rule>({});
    const { ruleProConnectors } = useRule(form||form2);
    const settings = useSettings();
    const filtered = useMemo(()=>{
        let filter = availableActions.
        filter(a=>settings.enableRun?true:(a.name!=="Run Command")).
        filter(a=>a.category===category.id)
        if (!form) return filter;
        return filter.filter(a=>a.provider?ruleProConnectors.find(c=>c.id===a.provider):true);
    }, [ ruleProConnectors ]);
    return (
    <>
        <Section open={opened} label={category.name} Icon={category.Icon} onClick={toggle} color={category.color?theme.colors[category.color][6]:undefined} />
        <Collapse in={opened} >
            {filtered.map(action=>
            <UnstyledButton onClick={()=>add(action)} p="xs" pt={5} pb={5} pl="md" key={action.name} className={classes.connector}>
                <Group>
                    <Box style={{ display: 'flex', alignItems: 'center' }} >
                        <action.Icon size={17} color={action.color?theme.colors[action.color][6]:undefined} />
                    </Box>
                    <div style={{ flex: 1 }}><Text size="sm">{action.name}</Text></div>
                </Group>
            </UnstyledButton>)}
        </Collapse>
    </>
    );
}

export default function ActionButton({ label, add, type, form, disabled }: { label: string, type?: string, add(c: availableAction, type: string): void, form?: UseFormReturnType<Rule>, disabled?: boolean }) {
    const [opened, { open, close }] = useDisclosure(false);
    const ref = useClickOutside(() => close());
    const addClose = (c: availableAction) => { add(c, type||""); close(); }
    const form2 = useForm<Rule>({});
    const { ruleProConnectors } = useRule(form||form2);
    const filtered = useMemo(()=>{
        if (!form) return availableCategories;
        return availableCategories.filter(a=>a.provider?ruleProConnectors.find(c=>c.id===a.provider):true);
    }, [ ruleProConnectors ]);
    return (
    <Popover opened={opened} width={300} position="left-start" shadow="md" clickOutsideEvents={['mouseup', 'touchend']}>
        <Popover.Target>
            <Button disabled={disabled} size="sm" onClick={open} rightSection={<IconChevronDown size="1.05rem" stroke={1.5} />} pr={12}>{label}</Button>
        </Popover.Target>
        <Popover.Dropdown ref={ref} >
            {filtered.map(category=><Category key={category.name} category={category} add={addClose} form={form} />)}
        </Popover.Dropdown>
    </Popover>
    );
}