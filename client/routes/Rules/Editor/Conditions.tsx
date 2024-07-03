import { ActionIcon, Autocomplete, Box, Button, Grid, Group, Menu, Popover, Select, Text, TextInput, Tooltip, useMantineTheme } from '@mantine/core';
import { UseFormReturnType } from '@mantine/form';
import { Icon, IconCalendar, IconChevronDown, IconCirclesRelation, IconCodeAsterix, IconCopy, IconDots, IconFile, IconFolder, IconGripVertical, IconMathFunction, IconProps, IconTrash, IconUserQuestion, IconUsersGroup } from '@tabler/icons-react';
import { ForwardRefExoticComponent, RefAttributes, useMemo } from 'react'
import { useRule } from './Editor';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import useTemplater, { templateProps } from '../../../hooks/useTemplater';
import SelectConnector from '../../../components/SelectConnector';

const stringOperators = [
    { label: '== Equal To', value: '==' },
    { label: '!= Not Equal To', value: '!=' },
    { label: '>< Contains', value: '><' },
    { label: '<> Does Not Contain', value: '<>' },
    { label: '>* Starts With', value: '>*' },
    { label: '*< Ends With', value: '*<' },
    { label: '// Matches Regex', value: '//' },
];

const mathOperators = [
    { label: '== Equal To', value: '===' },
    { label: '!= Not Equal To', value: '!==' },
    { label: '>  Greater Than', value: '>' },
    { label: '<  Lesser Than', value: '<' },
    { label: '>= Greater Than, Or Equal To', value: '>=' },
    { label: '<= Lesser Than, Or Equal To', value: '<=' },
];

const dateOperators = [
    { label: '== Equal To', value: 'date.==' },
    { label: '!= Not Equal To', value: 'date.!=' },
    { label: 'After', value: 'date.>' },
    { label: 'Before', value: 'date.<' },
];

const fileOperators = [
  { label: 'Exists', value: 'file.exists' },
  { label: 'Does not exist', value: 'file.notexists' }
];

const statusOperators = [
  { label: 'Exists on', value: 'ldap.exists' },
  { label: 'Does not exist on', value: 'ldap.notexists' },
  { label: 'Enabled on ', value: 'ldap.enabled' },
  { label: 'Disabled on', value: 'ldap.disabled' }
];

const groupOperators = [
  { label: 'Member of group', value: 'ldap.member' },
  { label: 'Not member of group', value: 'ldap.notmember' }
];

const ouOperators = [
  { label: 'Child of organisational unit', value: 'ldap.child' },
  { label: 'Not child of organisational unit', value: 'ldap.notchild' }
];

interface ValueInput {
    form: UseFormReturnType<Rule>;
    templateProps: templateProps;
    index: number;
}

function ValueInput( { form, index, templateProps }: ValueInput ) {
    const noDelimiter = form.values.conditions[index].delimiter;
    const icon =
    noDelimiter ? <IconDots size={16} style={{ display: 'block', opacity: 0.8 }} />:
    <IconCodeAsterix size={16} style={{ display: 'block', opacity: 0.8 }} />;
    const buttons =
    <Popover width={85} trapFocus position="left" shadow="md">
        <Popover.Target><Tooltip label="OR Delimiter" ><ActionIcon variant="subtle" >{icon}</ActionIcon></Tooltip></Popover.Target>
        <Popover.Dropdown pt={2} >
            <Autocomplete label="Delimiter" placeholder="," size="xs" {...form.getInputProps(`conditions.${index}.delimiter`)}
            data={[',',';', ':', '|', '-', '_', '/' ]}
            />
        </Popover.Dropdown>
    </Popover>;
    return (
      <TextInput placeholder='Value'
      {...form.getInputProps(`conditions.${index}.value`)}
      {...templateProps(form, `conditions.${index}.value`, { buttons })}
      />
    )
  }

function General({ form, templateProps, index, c }: { form: UseFormReturnType<Rule>, templateProps: templateProps, index: number, c: availableCondition }) {
    const data = useMemo(()=>{ switch (c.id) {
        case 'string': return stringOperators;
        case 'math': return mathOperators;
        case 'date': return dateOperators;
        default: return [];
    } }, [ c.id ]);
    return (
    <>
        <Grid.Col span="auto" >
            <TextInput placeholder='Key' {...templateProps(form, `conditions.${index}.key`)} />
        </Grid.Col>
        <Grid.Col span="content" >
            <Select
                placeholder="Operator"
                checkIconPosition="right"
                data={data} allowDeselect={false}
                {...form.getInputProps(`conditions.${index}.operator`)}
            />
        </Grid.Col>
        <Grid.Col span="auto" >
            <ValueInput form={form} index={index} templateProps={templateProps} />
        </Grid.Col>
    </>)
}

function File({ form, templateProps, index, c }: { form: UseFormReturnType<Rule>, templateProps: templateProps, index: number, c: availableCondition }) {
    return (
    <>
        <Grid.Col span="auto" >
            <ValueInput form={form} index={index} templateProps={templateProps} />
        </Grid.Col>
        <Grid.Col span="content" >
            <Select
                placeholder="Operator"
                checkIconPosition="right"
                data={fileOperators} allowDeselect={false}
                {...form.getInputProps(`conditions.${index}.operator`)}
            />
        </Grid.Col>
    </>)
}

function Ldap({ form, templateProps, index, c }: { form: UseFormReturnType<Rule>, templateProps: templateProps, index: number, c: availableCondition }) {
    const data = useMemo(()=>{ switch (c.id) {
        case 'ldap.status': return statusOperators;
        case 'ldap.group': return groupOperators;
        case 'ldap.ou': return ouOperators;
        default: return [];
    } }, [ c.id ]);
    return (
    <>
        <Grid.Col span="auto" >
            <SelectConnector {...form.getInputProps(`conditions.${index}.key`)} ids={["ldap"]} clearable />
        </Grid.Col>
        <Grid.Col span="content" >
            <Select
                placeholder="Operator"
                checkIconPosition="right"
                data={data} allowDeselect={false}
                {...form.getInputProps(`conditions.${index}.operator`)}
            />
        </Grid.Col>
        {c.id!=="ldap.status"&&<Grid.Col span="auto" >
            <ValueInput form={form} index={index} templateProps={templateProps} />
        </Grid.Col>}
    </>)
}

interface availableCondition {
    name: string,
    id: string,
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    color?: string,
    group: string,
    defaultOperator?: string,
    Options?(props: { form: UseFormReturnType<Rule>, templateProps?: templateProps, index: number, c: availableCondition }): JSX.Element;
}

const availableConditions: availableCondition[] = [
    {
        name: "String Constraint",
        id: 'string',
        Icon: IconCirclesRelation,
        color: "blue",
        group: "general",
        Options: General,
        defaultOperator: '==',
    },
    {
        name: "Math Constraint",
        id: 'math',
        Icon: IconMathFunction,
        color: "pink",
        group: "general",
        Options: General,
        defaultOperator: '===',
    },
    {
        name: "Date Constraint",
        id: 'date',
        Icon: IconCalendar,
        color: "red",
        group: "general",
        Options: General,
        defaultOperator: 'date.==',
    },
    {
        name: "File Constraint",
        id: 'file',
        Icon: IconFile,
        color: "lime",
        group: "file",
        Options: File,
        defaultOperator: 'file.exists',
    },
    {
        name: "Status",
        id: 'ldap.status',
        Icon: IconUserQuestion,
        color: "yellow",
        group: "directory",
        Options: Ldap,
        defaultOperator: 'ldap.exists',
    },
    {
        name: "Security Group",
        id: 'ldap.group',
        Icon: IconUsersGroup,
        color: "cyan",
        group: "directory",
        Options: Ldap,
        defaultOperator: 'ldap.member',
    },
    {
        name: "Organisational Unit",
        id: 'ldap.ou',
        Icon: IconFolder,
        color: "violet",
        group: "directory",
        Options: Ldap,
        defaultOperator: 'ldap.child',
    },
];

function Condition({ index, condition, form, templateProps }: { index: number, condition: Condition, form: UseFormReturnType<Rule>, templateProps: templateProps } ) {
    const theme = useMantineTheme();
    const c = availableConditions.find(c=>c.name===condition.name);
    if (!c) return <></>;
    const copy = (c: Condition) => () => form.insertListItem('conditions', structuredClone(c));
    const remove  = (index: number) => () => form.removeListItem('conditions', index);
    return (
        <Draggable index={index} draggableId={String(index)}>
        {provided => (
            <Grid align="center" mt="xs" gutter="xs" {...provided.draggableProps} ref={provided.innerRef} >
                <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Grid.Col span="content" >
                    <Group><Tooltip label={condition.name}><c.Icon color={c.color?theme.colors[c.color][6]:undefined} size="1.2rem" /></Tooltip></Group>
                </Grid.Col>
                {c.Options&&<c.Options index={index} form={form} templateProps={templateProps} c={c} />}
                <Grid.Col span="content">
                    <Group justify="right" gap="xs">
                        <Tooltip label="Remove" ><ActionIcon onClick={remove(index)} variant="default" size="lg"><IconTrash size={15}/></ActionIcon></Tooltip>
                        <Tooltip label="Copy" ><ActionIcon onClick={copy(condition)} variant="default" size="lg"><IconCopy size={15}/></ActionIcon></Tooltip>
                    </Group>
                </Grid.Col>
            </Grid>
        )}
        </Draggable>)
}

export default function Conditions({ form, label, compact }: { form: UseFormReturnType<Rule>, label?: string, compact?: boolean }) {
    const theme = useMantineTheme();
    const add = (c: availableCondition) => () => form.insertListItem('conditions', { name: c.name, operator: c.defaultOperator, key: null, value: null, });
    const { ruleProConnectors, sources } = useRule(form);
    const { templateProps, explorer } = useTemplater({names:sources});
    const ldapProvider = ruleProConnectors.find(c=>c.id!=="ldap");
    return (
    <Box> {explorer}
        <Grid justify="space-between" gutter={0} align="center" >
            <Grid.Col span="content" >
                <Text c="dimmed" size="xs" >{label||"Conditions are evaluated per row, entry, user, etc and must all be true for iterative actions to execute."}</Text>
            </Grid.Col>
            <Grid.Col span="content">
                <Menu position="bottom-end" >
                    <Menu.Target>
                        <Button size={compact?"compact-xs":"sm"} rightSection={<IconChevronDown size="1.05rem" stroke={1.5} />} pr={12}>Add condition</Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                    <Menu.Label>General</Menu.Label>
                    {availableConditions.filter(c=>c.group==="general").map(c=>
                        <Menu.Item key={c.id} onClick={add(c)} leftSection={<c.Icon color={c.color?theme.colors[c.color][6]:undefined} size="1rem" stroke={1.5} />}>{c.name}</Menu.Item>
                    )}
                    <Menu.Label>File System</Menu.Label>
                    {availableConditions.filter(c=>c.group==="file").map(c=>
                        <Menu.Item key={c.id} onClick={add(c)} leftSection={<c.Icon color={c.color?theme.colors[c.color][6]:undefined} size="1rem" stroke={1.5} />}>{c.name}</Menu.Item>
                    )}
                    {ldapProvider&&<>
                    <Menu.Label>Directory</Menu.Label>
                    {availableConditions.filter(c=>c.group==="directory").map(c=>
                        <Menu.Item key={c.id} onClick={add(c)} leftSection={<c.Icon color={c.color?theme.colors[c.color][6]:undefined} size="1rem" stroke={1.5} />}>{c.name}</Menu.Item>
                    )}
                    </>}
                    </Menu.Dropdown>
                </Menu>
            </Grid.Col>
        </Grid>
        {(form.values.conditions||[]).length===0&&<Text c="lighter" size="sm" >No conditions in effect. All iterative actions will be executed.</Text>}
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem('conditions', { from: source.index, to: destination? destination.index : 0 }) } >
        <Droppable droppableId="dnd-list" direction="vertical">
            {provided => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {(form.values.conditions||[]).map((condition, index) =><Condition key={index} index={index} condition={condition} form={form} templateProps={templateProps} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Box>
  )
}
