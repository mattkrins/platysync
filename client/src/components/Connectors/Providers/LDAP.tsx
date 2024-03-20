import { TextInput, SimpleGrid, PasswordInput, ActionIcon, Button, Group, Grid, Center, Checkbox } from '@mantine/core'
import { UseFormReturnType } from '@mantine/form'
import { IconTag, IconWorld, IconUser, IconKey, IconEdit, IconGripVertical, IconTrash, IconFolder, IconServer, IconSearch } from '@tabler/icons-react'
import Concealer from '../../Common/Concealer';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { SelectCreatable } from '../../Common/SelectCreatable';
import { ldapAttributes } from '../../../modules/common';

function Attributes( { form }: { form: UseFormReturnType<Record<string, unknown>> } ) {
    const data = (form.values.attributes || []) as string[];
    return (<>
        {data.length===0&&<Center c="dimmed" fz="xs" >No attributes configured.</Center>}
        <DragDropContext
        onDragEnd={({ destination, source }) => form.reorderListItem('attributes', { from: source.index, to: destination? destination.index : 0 }) }
        >
        <Droppable droppableId="dnd-list" direction="vertical">
            {(provided) => (
            <div {...provided.droppableProps} style={{top: "auto",left: "auto"}} ref={provided.innerRef}>
                {data.map((_, index) => (
                <Draggable key={index} index={index} draggableId={index.toString()}>
                    {(provided) => (
                    <Grid gutter="xs" align="center" ref={provided.innerRef} mt="xs" {...provided.draggableProps}
                    style={{ ...provided.draggableProps.style, left: "auto !important", top: "auto !important", }}
                    >
                        <Grid.Col span="content" style={{ cursor: 'grab' }} {...provided.dragHandleProps}  >
                            <Group><IconGripVertical size="1.2rem" /></Group>
                        </Grid.Col>
                        <Grid.Col span="auto">
                            <SelectCreatable
                            selectable={ldapAttributes}
                            {...form.getInputProps(`attributes.${index}`)}
                            createLabel={(query) => `Add Custom Attribute: ${query}`}
                            />
                        </Grid.Col>
                        <Grid.Col span="content">
                            <Group gap={0} justify="flex-end">
                                <ActionIcon onClick={()=>form.removeListItem('attributes', index)} variant="subtle" color="red">
                                    <IconTrash size="1.2rem" stroke={1.5} />
                                </ActionIcon>
                            </Group>
                        </Grid.Col>
                    </Grid>
                    )}
                </Draggable>
                ))}
                {provided.placeholder}
            </div>
            )}
        </Droppable>
        </DragDropContext>
        </>
    );
}

export default function LDAP( { form, editing }: { form: UseFormReturnType<Record<string, unknown>>, editing: Connector|undefined  } ) {
    const unlock = () => form.setFieldValue('password', '');
    const add = () => form.insertListItem('attributes', '');
    return (<>
        <TextInput
            label="Connector Name"
            leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="Domain Name"
            withAsterisk {...form.getInputProps('name')}
        />
        <TextInput
            label="Target URL"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="ldaps://10.10.1.1:636"
            withAsterisk {...form.getInputProps('url')}
            mt="md"
        />
        <SimpleGrid mt="md" cols={{ base: 1, sm: 2 }} >
            <TextInput
                label="Username"
                placeholder="domain\administrator"
                withAsterisk
                leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                {...form.getInputProps('username')}
            />
            {(typeof form.values.password) === 'string' || !editing  ?<PasswordInput
                label="Password"
                placeholder="password"
                withAsterisk
                leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                {...form.getInputProps('password')}
            />:<PasswordInput
                label="Password"
                readOnly={true}
                placeholder="Password"
                value="**************"
                leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                rightSection={
                    <ActionIcon variant="subtle"><IconEdit onClick={()=>unlock()} size={16} style={{ display: 'block', opacity: 0.5 }} /></ActionIcon>
                }
            />}
        </SimpleGrid>
        <Concealer open label='Attributes' rightSection={<Button onClick={()=>add()} maw={50} variant="light" size='compact-xs' mt={10}>Add</Button>} >
            <Attributes form={form} />
        </Concealer>
        <Concealer>
            <Checkbox mt="md" label="Specify Root DSE"
            onChange={(event) => form.setFieldValue('dse', event.currentTarget.checked?'':undefined)}
            checked={!!form.values.dse||form.values.dse===''}
            />
            {(form.values.dse||form.values.dse==='')&&
            <TextInput
                label="Root DSE"
                description="All distinguished names, including the Base Organizational Unit, will be appended by this path."
                placeholder="dc=sub,dc=domain,dc=com"
                withAsterisk
                leftSection={<IconServer size={16} style={{ display: 'block', opacity: 0.5 }} />}
                {...form.getInputProps('dse')}
            />}
            <TextInput mt="md"
            label="Base Organizational Unit"
            description="All distinguished names will be appended by this path."
            placeholder="ou=child,ou=parent"
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.5 }} />}
            {...form.getInputProps('base')}
            />
            <TextInput mt="md"
            label="Search Filter"
            description={<>Searches will be refined using this <a href='https://ldap.com/ldap-filters/' target='_blank'>filter</a>.</>}
            placeholder="(objectclass=person)"
            leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }} />}
            {...form.getInputProps('filter')}
            />
        </Concealer>
    </>)
}
