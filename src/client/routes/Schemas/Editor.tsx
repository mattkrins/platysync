import { Alert, Button, Group, Modal, Text, TextInput } from "@mantine/core";
import NewSchema from "../../components/NewSchema";
import { useDispatch } from "../../hooks/redux";
import useAPI from "../../hooks/useAPI";
import { loadSchemas } from "../../providers/appSlice";
import { modals } from "@mantine/modals";
import { isNotEmpty, useForm } from "@mantine/form";
import { IconAlertCircle, IconCheck, IconTag } from "@tabler/icons-react";
import { onKeyUp } from "../../modules/common";

function Content({ schema, adding, close }: { schema: Schema, adding: boolean, close(): void }) {
  if (adding) return <NewSchema then={close}  />;
  const form = useForm<Schema>({ initialValues: structuredClone(schema), validate: {
    name: isNotEmpty('Schema name can not be empty.'),
  } });
  const dispatch = useDispatch();
  const { data: success, put: save, del, loading, error } = useAPI({
    url: `/schema`, form,
    data: { editing: schema.name },
    then: () => close(),
    finally: () => dispatch(loadSchemas())
  });
  const deleteSchema = () =>
    modals.openConfirmModal({
      title: 'Delete Schema',
      children: <Text size="sm">Are you sure you want to delete <b>{schema.name}</b>?<br/>This action is destructive and cannot be reversed.</Text>,
      labels: { confirm: 'Delete schema', cancel: "Cancel" },
      confirmProps: { color: 'red' },
      onConfirm: () => del(),
  });
  return (
  <>
    {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">Schema updated successfully.</Alert>}
    {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
    <TextInput
      label="Schema Name" placeholder="Schema Name"
      leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
      withAsterisk {...form.getInputProps('name')} onKeyUp={onKeyUp(save)}
    />
    <Group justify="space-between" mt="md">
      <Button loading={loading} onClick={deleteSchema} color="red">Delete</Button>
      <Button loading={loading} onClick={()=>save()}>Save</Button>
    </Group>
  </>
  )
}

export default function Editor({ open, adding, close }: { open?: Schema, adding: boolean, close(): void }) {
  return (
    <Modal opened={!!open} onClose={close} title={adding ? "New Schema" : "Edit Schema"}>
      {!!open&&<Content schema={open} adding={adding} close={close} />}
    </Modal>
  );  
}