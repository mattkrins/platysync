import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Box, Grid, Menu, Button, Text, useMantineTheme, Group, Tooltip, ActionIcon, Select, Popover, Autocomplete, Switch } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { Icon, IconCalendar, IconChevronDown, IconCircle, IconCirclesRelation, IconCodeAsterix, IconCopy, IconFile, IconFolder, IconGripVertical, IconLetterCase, IconMathFunction, IconProps, IconTrash, IconUserQuestion, IconUsersGroup } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes, useMemo } from "react";
import ExtTextInput from "./ExtTextInput";
import SelectConnector from "./SelectConnector";
import useRule from "../hooks/useRule";

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
    form: UseFormReturnType<any>;
    index: number;
    path: string;
    rule?: Rule;
}

function ValueInput( { form, index, path, rule }: ValueInput ) {
    const delimiter = form.getInputProps(`${path}.${index}.delimiter`).value;
    const and = form.getInputProps(`${path}.${index}.and`).value;
    const label = `${!delimiter?"Add":(and?"AND":"OR")} Delimite${delimiter?'d':'r'}`;
    const icon =
    delimiter ? <IconCircle size={16} style={{ display: 'block', opacity: 0.8 }} />:
    <IconCodeAsterix size={16} style={{ display: 'block', opacity: 0.8 }} />;
    const buttons =
    <Popover width={140} trapFocus position="left" shadow="md">
        <Popover.Target>
            <Tooltip label={label} ><ActionIcon variant="subtle" >{icon}</ActionIcon></Tooltip>
        </Popover.Target>
        <Popover.Dropdown pt={2} >
            <Autocomplete label={
            <Group mb={4} >
                <Text size="xs">Delimiter</Text>
                <Tooltip label={and?"AND":"OR"} refProp="rootRef" >
                <Switch labelPosition="left" onLabel="AND" offLabel="OR"
                {...form.getInputProps(`${path}.${index}.and`, { type: 'checkbox' })}
                /></Tooltip>
            </Group>
            }
            placeholder="," size="xs" {...form.getInputProps(`${path}.${index}.delimiter`)}
            data={[',',';', ':', '|', '-', '_', '/' ]}
            />
        </Popover.Dropdown>
    </Popover>;
    return ( <ExtTextInput placeholder="Value" rule={rule} {...form.getInputProps(`${path}.${index}.value`)} rightSection={[buttons]} /> )
}

function General({ form, index, c, path, rule }: { form: UseFormReturnType<any>, index: number, c: availableCondition, path: string, rule?: Rule }) {
    const data = useMemo(()=>{ switch (c.id) {
        case 'string': return stringOperators;
        case 'math': return mathOperators;
        case 'date': return dateOperators;
        default: return [];
    } }, [ c.id ]);
    const ignore = form.getInputProps(`${path}.${index}.case`).value || false;
    const toggleCase = () => form.setFieldValue(`${path}.${index}.case`, !ignore);
    return (
    <>
        <Grid.Col span="auto" >
            <ExtTextInput placeholder="Key" rule={rule} {...form.getInputProps(`${path}.${index}.key`)} />
        </Grid.Col>
        <Grid.Col span="content" >
            <Select
                placeholder="Operator"
                checkIconPosition="right"
                data={data} allowDeselect={false}
                {...form.getInputProps(`${path}.${index}.operator`)}
            />
        </Grid.Col>
        <Grid.Col span="auto" ><ValueInput form={form} rule={rule} index={index} path={path} /></Grid.Col>
        {c.id==="string"&&
        <Grid.Col span="content" >
            <Tooltip label="Ignore Case" ><ActionIcon onClick={toggleCase} variant={ignore?"outline":"default"} size="lg"><IconLetterCase size={15}/></ActionIcon></Tooltip>
        </Grid.Col>}

    </>)
}

function File({ form, index, path, rule }: { form: UseFormReturnType<Rule>, index: number, path: string, rule?: Rule }) {
    return (
    <>
        <Grid.Col span="auto" >
            <ValueInput form={form} rule={rule} index={index} path={path} />
        </Grid.Col>
        <Grid.Col span="content" >
            <Select
                placeholder="Operator"
                checkIconPosition="right"
                data={fileOperators} allowDeselect={false}
                {...form.getInputProps(`${path}.${index}.operator`)}
            />
        </Grid.Col>
    </>)
}

function Ldap({ form, rule, index, c, path }: { form: UseFormReturnType<Rule>, index: number, c: availableCondition, path: string, rule: Rule  }) {
    const { sources } = useRule(rule);
    const data = useMemo(()=>{ switch (c.id) {
        case 'ldap.status': return statusOperators;
        case 'ldap.group': return groupOperators;
        case 'ldap.ou': return ouOperators;
        default: return [];
    } }, [ c.id ]);
    return (
    <>
        <Grid.Col span="auto" >
            <SelectConnector ids={["ldap"]} names={sources}
            {...form.getInputProps(`${path}.${index}.key`)}
            />
        </Grid.Col>
        <Grid.Col span="content" >
            <Select
                placeholder="Operator"
                checkIconPosition="right"
                data={data} allowDeselect={false}
                {...form.getInputProps(`${path}.${index}.operator`)}
            />
        </Grid.Col>
        {c.id!=="ldap.status"&&<Grid.Col span="auto" >
            <ValueInput form={form} rule={rule} index={index} path={path} />
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
    Options?(props: { index: number, form: UseFormReturnType<any>, c: availableCondition, path: string, rule?: Rule }): JSX.Element;
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
        name: "Folder Constraint",
        id: 'folder',
        Icon: IconFolder,
        color: "green",
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

function Condition({ index, condition, form, path, rule }: { index: number, condition: Condition, form: UseFormReturnType<any>, path: string, rule?: Rule } ) {
    const theme = useMantineTheme();
    const c = availableConditions.find(c=>c.name===condition.name);
    if (!c) return <></>;
    const copy = (c: Condition) => () => form.insertListItem(path, structuredClone(c));
    const remove  = (index: number) => () => form.removeListItem(path, index);
    const ldap = c.id.includes("ldap");
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
                { (ldap && !rule) ? <>ERROR</> :  c.Options&&<c.Options index={index} form={form} c={c} path={path} rule={rule} />} 
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

interface conditionProps {
    label?: string;
    compact?: boolean;
    ldap?: boolean;
    form: UseFormReturnType<any>
    path?: string;
    rule?: Rule;
}

export default function Conditions({ label, ldap, compact, form, path = "conditions", rule }: conditionProps) {
    const theme = useMantineTheme();
    const add = (c: availableCondition) => () => form.insertListItem(path, { name: c.name, operator: c.defaultOperator, key: undefined, value: undefined, });
    const conditions = form.values[path] as Condition[];
    return (
        <Box>
        <Grid justify="space-between" gutter={0} align="center" >
            <Grid.Col span="content" >
                <Text c="dimmed" size="xs" >{label||"Conditions are evaluated for each row, entry, user, etc and must all be true for an iterative action to execute."}</Text>
            </Grid.Col>
            <Grid.Col span="content">
            <Menu position="bottom-end" >
                    <Menu.Target>
                        <Button size={compact?"compact-xs":"sm"} rightSection={<IconChevronDown size="1.05rem" stroke={1.5} />} pr={12}>Add Condition</Button>
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
                    {ldap&&<>
                    <Menu.Label>Directory</Menu.Label>
                    {availableConditions.filter(c=>c.group==="directory").map(c=>
                        <Menu.Item key={c.id} onClick={add(c)} leftSection={<c.Icon color={c.color?theme.colors[c.color][6]:undefined} size="1rem" stroke={1.5} />}>{c.name}</Menu.Item>
                    )}
                    </>}
                    </Menu.Dropdown>
                </Menu>
            </Grid.Col>
        </Grid>
        {conditions.length===0&&<Text c="lighter" size="sm" >No conditions in effect. All iterative actions will be evaluated & executed.</Text>}
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(path, { from: source.index, to: destination? destination.index : 0 }) } >
        <Droppable droppableId="dnd-list" direction="vertical">
            {provided => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {conditions.map((c, i) =><Condition key={i} index={i} condition={c} form={form} path={path} rule={rule} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Box>
    )
}