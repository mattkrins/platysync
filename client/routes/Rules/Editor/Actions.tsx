import { Box, Button, Collapse, Divider, Group, Popover, Text, UnstyledButton, useMantineTheme } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { useClickOutside, useDisclosure } from "@mantine/hooks";
import classes from './Actions.module.css';
import { IconProps, Icon, IconChevronRight, IconChevronDown } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { availableActions, availableCategories, availableCategory } from "../../../modules/actions";
//LINK - https://github.com/hello-pangea/dnd/blob/main/docs/api/droppable.md#conditionally-dropping

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

function Category({ category }: { category: availableCategory }) {
    const theme = useMantineTheme();
    const [opened, { toggle }] = useDisclosure(false);
    return (
    <>
        <Section open={opened} label={category.name} Icon={category.Icon} onClick={toggle} color={category.color?theme.colors[category.color][6]:undefined} />
        <Collapse in={opened} >
            {availableActions.filter(a=>a.category===category.id).map(action=>
            <UnstyledButton onClick={()=>{}} p="xs" pt={5} pb={5} pl="md" key={action.name} className={classes.connector}>
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

function ActionButton() {
    const [opened, { open, close }] = useDisclosure(false);
    const ref = useClickOutside(() => close());
    return (
    <Popover opened={opened} width={300} position="left-start" shadow="md" clickOutsideEvents={['mouseup', 'touchend']}>
        <Popover.Target>
            <Button size="sm" onClick={open} rightSection={<IconChevronDown size="1.05rem" stroke={1.5} />} pr={12}>Add action</Button>
        </Popover.Target>
        <Popover.Dropdown ref={ref} >
            {availableCategories.map(category=><Category category={category} />)}
        </Popover.Dropdown>
    </Popover>
    );
}

export default function Actions({ form }: { form: UseFormReturnType<Rule> }) {
  return (
  <Box>
      <Divider my="xs" label={<ActionButton/>} labelPosition="right" />
  </Box>)
}
