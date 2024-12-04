/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import { Modal, Box, Group, Button, Alert, TextInput } from '@mantine/core';
import { availableOperations, operationProp } from '../Rules/Editor/operations';
import { isNotEmpty, useForm } from '@mantine/form';
import useAPI from '../../../hooks/useAPI';
import { IconAlertCircle, IconCheck, IconTag } from '@tabler/icons-react';

const validate = {
  name: isNotEmpty('Name can not be empty.'),
}

function Content({ action, adding, refresh }: { action: Action, refresh(): void, close(): void, adding: boolean }) {
  const form = useForm<Action>({ validate, initialValues: structuredClone(action) });
  const { data: success, put, post, loading, error } = useAPI<kvPair, FormData>({
    url: `/blueprint${adding?'':`/${action.name}`}`, schema: true, form,
    then: () => { refresh(); close(); },
  });
  const operation = availableOperations.find(a=>a.name===action.id);
  if (!operation) return;
  const  { Operation, label } = operation;
  const props = (name: string, options?: { type?: any }) => {
      const props: operationProp = {...form.getInputProps(name, options)};
      if (options?.type === "password") {
          props.secure = !!props.value && typeof props.value !== 'string';
          props.unlock = () => form.setFieldValue(name, "");
      }
      return props;
  }
  return (
  <Box>
    {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">Entry {adding ? "added" : "updated"} successfully.</Alert>}
    {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
    <TextInput required
    label="Blueprint Name" pb="xs"
    placeholder={label}
    {...form.getInputProps('name')}
    leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
    />
    {Operation&&<Operation props={props} form={form as any}  />}
    <Group justify="flex-end" mt="md">
          <Button loading={loading} onClick={()=>adding?post():put()}>{adding ? "Add" : "Save"}</Button>
    </Group>
  </Box>
  )
}

export default function Editor({ open, adding, close, refresh }: { open?: Action, adding: boolean, close(): void, refresh(): void }) {
  return (
    <Modal opened={!!open} onClose={close} title={adding ? "New Blueprint" : "Edit Blueprint"}>
      {!!open&&<Content action={open} refresh={refresh} adding={adding} close={close} />}
    </Modal>
  );
}