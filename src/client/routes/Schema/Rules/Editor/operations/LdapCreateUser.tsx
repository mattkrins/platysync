import { Autocomplete, AutocompleteProps, Button, Center, Grid, Group, Switch, TextInput } from "@mantine/core";
import { IconHierarchy, IconAt, IconUser, IconFolder, IconCopy, IconGripVertical, IconPencil, IconTag, IconTrash, IconPlus } from "@tabler/icons-react";
import ExtTextInput from "../../../../../components/ExtTextInput";
import { operationProps } from "../operations";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import MenuTip from "../../../../../components/MenuTip";
import { ldapAttributes } from "../../../../../modules/ldap";
import Concealer from "../../../../../components/Concealer";

interface Attribute extends operationProps {
    index: number;
    copy(): void;
    remove(): void;
}

function Attribute({ index, copy, remove, rule, props }: Attribute ) {
    return (
    <Draggable index={index} draggableId={String(index)}>
        {provided => (
            <Grid align="center" mt="xs" gutter="xs" {...provided.draggableProps} ref={provided.innerRef} >
                <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Grid.Col span="auto" >
                    <ExtTextInput<AutocompleteProps> Component={Autocomplete} rule={rule}
                    leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Name" data={ldapAttributes}
                    {...props(`attributes.${index}.name`)}
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <ExtTextInput rule={rule}
                    leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Value"
                    {...props(`attributes.${index}.value`)}
                    />
                </Grid.Col>
                <Grid.Col span="content">
                    <Group justify="right" gap="xs">
                        <MenuTip label="Copy" Icon={IconCopy} onClick={copy} variant="default" />
                        <MenuTip label="Delete" Icon={IconTrash} onClick={remove} variant="default" />
                    </Group>
                </Grid.Col>
            </Grid>
        )}
    </Draggable>)
}

function Attributes( { form, path, rule, props }: operationProps ) {
    const templatePath = `${path}.attributes`;
    const entries = form.getInputProps(templatePath).value as { name: string,value: string }[];
    const add = () => form.insertListItem(templatePath, { name: undefined, value: undefined, });
    const copy = (e: { name: string, value: string }) => form.insertListItem(templatePath, structuredClone(e));
    const remove = (i: number) => form.removeListItem(templatePath, i);
    return (
    <Concealer label='Attributes' open rightSection={
        <Group justify="end" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Attribute</Button></Group> } >
        {entries.length===0&&<Center c="dimmed" fz="xs" >No attributes configured.</Center>}
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(templatePath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {entries.map((e, i) => <Attribute key={i} props={props} index={i} copy={()=>copy(e)} remove={()=>remove(i)} form={form} rule={rule} path={templatePath} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Concealer>
  )
}


interface SecurityGroup extends operationProps {
    index: number;
    copy(): void;
    remove(): void;
}

function SecurityGroup({ index, copy, remove, rule, props }: SecurityGroup ) {
    return (
    <Draggable index={index} draggableId={String(index)}>
        {provided => (
            <Grid align="center" mt="xs" gutter="xs" {...provided.draggableProps} ref={provided.innerRef} >
                <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Grid.Col span="auto" >
                    <ExtTextInput rule={rule}
                    leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="CN={{name}},OU={{faculty}},OU=Child,OU=Parent"
                    {...props(`groups.${index}`)}
                    />
                </Grid.Col>
                <Grid.Col span="content">
                    <Group justify="right" gap="xs">
                        <MenuTip label="Copy" Icon={IconCopy} onClick={copy} variant="default" />
                        <MenuTip label="Delete" Icon={IconTrash} onClick={remove} variant="default" />
                    </Group>
                </Grid.Col>
            </Grid>
        )}
    </Draggable>)
}

function SecurityGroups( { form, path, props, rule }: operationProps ) {
    const templatePath = `${path}.groups`;
    const entries = form.getInputProps(templatePath).value as string[];
    const add = () => form.insertListItem(templatePath, "");
    const copy = (e: string) => form.insertListItem(templatePath, structuredClone(e));
    const remove = (i: number) => form.removeListItem(templatePath, i);
    return (
    <Concealer label='Security Groups' open rightSection={
        <Group justify="end" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Security Group</Button></Group> } >
        {entries.length===0&&<Center c="dimmed" fz="xs" >No security groups configured.</Center>}
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(templatePath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {entries.map((e, i) => <SecurityGroup key={i} props={props} index={i} copy={()=>copy(e)} remove={()=>remove(i)} form={form} rule={rule} path={templatePath} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Concealer>
  )
}


export default function LdapCreateUser( { props, rule, form, path, blueprint }: operationProps ) {
    return ( //TODO - add descriptions
    <>
        <ExtTextInput rule={rule} withAsterisk={!blueprint?.target}
            label="SAM Account Name"
            leftSection={<IconHierarchy size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{username}}"
            {...props("sam")}
        />
        <ExtTextInput rule={rule} withAsterisk={!blueprint?.target}
            label="User Principal Name"
            leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{username}}@domain.com"
            {...props("upn")}
        />
        <ExtTextInput rule={rule} withAsterisk={!blueprint?.target}
            label="Canonical Name"
            leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{first_name}} {{family_name}}"
            {...props("cn")}
        />
        <ExtTextInput rule={rule}
            label="Organizational Unit"
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="ou={{faculty}},ou=child,ou=parent"
            {...props("ou")}
        />
        <Switch
            label="User Enabled" mt="xs"
            {...props("newline", { type: 'checkbox' })}
        />
        <Attributes form={form} path={path} rule={rule} props={props} />
        <SecurityGroups form={form} path={path} rule={rule} props={props} />
    </>
    )
}