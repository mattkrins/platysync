import { Alert, Button, Group, Modal, TextInput, Text } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { IconCheck, IconBraces, IconAlertCircle, IconTextCaption } from "@tabler/icons-react";
import useAPI from "../../../hooks/useAPI";

const validate = {
    key: isNotEmpty('Key can not be empty.'),
    value: isNotEmpty('Value can not be empty.'),
}

function Content({ entry, refresh, adding, close }: { entry: kvPair, refresh(): void, adding: boolean, close(): void }) {
  const form = useForm<kvPair>({ validate, initialValues: structuredClone(entry) });
  const { data: success, put, post, loading, error } = useAPI<kvPair, FormData>({
    url: `/dictionary${adding?'':`/${entry.key}`}`, form,
    then: () => { refresh(); close(); },
  });
  return (<>
    {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">Entry {adding ? "added" : "updated"} successfully.</Alert>}
    {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
    <TextInput required
    label="Template Key" pb="xs"
    description="Key to use in the templating syntax {{gdict.key}}."
    placeholder="key"
    {...form.getInputProps('key')}
    leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.5 }}/>}
    />
    <TextInput required
    label="Template Value" pb={5}
    description="String value which will replace the template key."
    placeholder="value"
    {...form.getInputProps('value')}
    leftSection={<IconTextCaption size={16} style={{ display: 'block', opacity: 0.5 }}/>}
    />
    <Text c="dimmed" size="xs">Example template: {`Hello {{gdict.${form.getInputProps('key').value||"key"}}}`}</Text>
    <Text c="dimmed" size="xs">Example output: {`Hello ${form.getInputProps('value').value}`}</Text>
    <Group justify={adding?"flex-end":"space-between"} mt="md">
          <Button loading={loading} onClick={()=>adding?post():put()}>{adding ? "Add" : "Save"}</Button>
    </Group>
  </>)
}

export default function Editor({ open, adding, close, refresh }: { open?: kvPair, adding: boolean, close(): void, refresh(): void }) {
  return (
    <Modal opened={!!open} onClose={close} title={adding ? "New Entry" : "Edit Entry"}>
      {!!open&&<Content entry={open} refresh={refresh} adding={adding} close={close} />}
    </Modal>
  );
}