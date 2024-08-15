import { ActionIcon, Autocomplete, Button, Center, Grid, Group, PasswordInput, Switch, TextInput } from '@mantine/core'
import { IconAt, IconBraces, IconCopy, IconEye, IconEyeOff, IconFolder, IconGripVertical, IconHierarchy, IconKey, IconPencil, IconPlus, IconTrash, IconUser } from '@tabler/icons-react'
import { actionProps } from '../../../../modules/actions'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { UseFormReturnType } from '@mantine/form';
import MenuTip from '../../../../components/MenuTip';
import Concealer from '../../../../components/Concealer';
import { ldapAttributes } from '../../../../modules/ldap';
import { useDisclosure } from '@mantine/hooks';

function Attribute({ index, entry, form, templateProps, path }:
    { index: number, entry: { key: string,value: string }, form: UseFormReturnType<Rule>, templateProps: actionProps['templateProps'], path: string }
) {
    const copy = () => form.insertListItem(path, structuredClone(entry));
    const remove = () => form.removeListItem(path, index);
    return (
    <Draggable index={index} draggableId={String(index)}>
        {provided => (
            <Grid align="center" mt="xs" gutter="xs" {...provided.draggableProps} ref={provided.innerRef} >
                <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Grid.Col span="auto" >
                    <Autocomplete {...templateProps(form, `${path}.${index}.key`)}
                    leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Name" data={ldapAttributes}
                    />
                </Grid.Col>
                <Grid.Col span="auto" >
                    <TextInput {...templateProps(form, `${path}.${index}.value`)}
                    leftSection={<IconPencil size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="Value"
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

function Attributes( { form, path, templateProps }: actionProps ) {
    const templatePath = `${path}.attributes`;
    const entries = form.getInputProps(templatePath).value as { key: string,value: string }[];
    const add = () => form.insertListItem(templatePath, { key: undefined, value: undefined, });
    return (
    <Concealer label='Attributes' open rightSection={
        <Group justify="end" ><Button onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Attribute</Button></Group> } >
        {entries.length===0&&<Center c="dimmed" fz="xs" >No attributes configured.</Center>}
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(templatePath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {entries.map((entry, index) => <Attribute key={index} index={index} entry={entry} form={form} templateProps={templateProps} path={templatePath} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Concealer>
  )
}

function SecurityGroup({ index, entry, form, templateProps, path }:
    { index: number, entry: string, form: UseFormReturnType<Rule>, templateProps: actionProps['templateProps'], path: string }
) {
    const copy = () => form.insertListItem(path, entry);
    const remove = () => form.removeListItem(path, index);
    return (
    <Draggable index={index} draggableId={String(index)}>
        {provided => (
            <Grid align="center" mt="xs" gutter="xs" {...provided.draggableProps} ref={provided.innerRef} >
                <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                    <Group><IconGripVertical size="1.2rem" /></Group>
                </Grid.Col>
                <Grid.Col span="auto" >
                    <TextInput {...templateProps(form, `${path}.${index}`)}
                    leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                    placeholder="CN={{name}},OU={{faculty}},OU=Child,OU=Parent"
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

function SecurityGroups( { form, path, templateProps }: actionProps ) {
    const templatePath = `${path}.groups`;
    const entries = form.getInputProps(templatePath).value as string[];
    const add = () => form.insertListItem(templatePath, "");
    return (
    <Concealer label='Security Groups' open rightSection={
        <Group justify="end" ><Button mt="xs" onClick={add} size="compact-xs" rightSection={<IconPlus size="1.05rem" stroke={1.5} />} >Add Security Group</Button></Group> } >
        {entries.length===0&&<Center c="dimmed" fz="xs" >No security groups configured.</Center>}
        <DragDropContext onDragEnd={({ destination, source }) => form.reorderListItem(templatePath, { from: source.index, to: destination? destination.index : 0 }) } >
            <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {entries.map((entry, index) => <SecurityGroup key={index} index={index} entry={entry} form={form} templateProps={templateProps} path={templatePath} />)}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
    </Concealer>
  )
}


export default function LdapCreateUser( { form, path, templateProps }: actionProps ) {
    const [visible, { toggle }] = useDisclosure(false);
    const EyeIcon = <ActionIcon onClick={toggle} variant="subtle">{!visible ?
        <IconEye style={{ width: 'var(--psi-icon-size)', height: 'var(--psi-icon-size)' }} /> :
        <IconEyeOff style={{ width: 'var(--psi-icon-size)', height: 'var(--psi-icon-size)' }} />}
    </ActionIcon>;
    return (
    <>
        <TextInput
            label="Canonical Name" withAsterisk
            leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{username}}"
            {...templateProps(form, `${path}.cn`)}
        />
        <TextInput
            label="User Principal Name" withAsterisk
            leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{username}}@domain.com"
            {...templateProps(form, `${path}.upn`)}
        />
        <TextInput
            label="SAM Account Name" withAsterisk
            leftSection={<IconHierarchy size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{username}}"
            {...templateProps(form, `${path}.sam`)}
        />
        <TextInput
            label="Organizational Unit" withAsterisk
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="ou={{faculty}},ou=child,ou=parent"
            {...templateProps(form, `${path}.ou`)}
        />
        <PasswordInput
            label="Password"
            leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.8 }}/>}
            placeholder="{{word}}{{rand 1 9}}{{cap (word)}}{{special}}"
            visible={visible}
            {...templateProps(form, `${path}.password`, { buttons: EyeIcon })}
        />
        <Switch label="User Enabled" disabled={ !form.getInputProps(`${path}.password`).value }
        mt="xs" {...form.getInputProps(`${path}.enable`, { type: 'checkbox' })}
        />
        <Attributes form={form} path={path} templateProps={templateProps} />
        <SecurityGroups form={form} path={path} templateProps={templateProps} />
    </>
  )
}
