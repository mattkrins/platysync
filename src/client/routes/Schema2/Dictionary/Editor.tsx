import { Alert, Button, Group, Modal, TextInput } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { IconCheck, IconBraces, IconAlertCircle, IconTextCaption } from "@tabler/icons-react";
import useAPI from "../../../hooks/useAPI";

const validate = {
    key: isNotEmpty('Key can not be empty.'),
    value: isNotEmpty('Key can not be empty.'),
}

function Content({ entry, refresh, adding, close }: { entry: dictionaryEntry, refresh(): void, adding: boolean, close(): void }) {
  const form = useForm<dictionaryEntry>({ validate, initialValues: structuredClone(entry) });
  const { data: success, put, post, loading, error } = useAPI<dictionaryEntry, FormData>({
    url: `/file${adding?'':`/${entry.key}`}`, schema: true, form,
    then: () => { refresh(); close(); },
  });
  return (<>
    {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">Entry {adding ? "added" : "updated"} successfully.</Alert>}
    {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
    <TextInput
    label="Template Key" pb="xs" required
    description="Key to use in the templating syntax {{sdict.key}}."
    placeholder="key"
    {...form.getInputProps('key')}
    leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.5 }}/>}
    />
    <TextInput
    label="Template Value" pb="xs"
    description="String value which will replace the template key."
    placeholder="value" required
    {...form.getInputProps('value')}
    leftSection={<IconTextCaption size={16} style={{ display: 'block', opacity: 0.5 }}/>}
    />
    <Group justify={adding?"flex-end":"space-between"} mt="md">
          <Button loading={loading} onClick={()=>adding?post():put()}>{adding ? "Add" : "Save"}</Button>
    </Group>
  </>)
}

export default function Editor({ open, adding, close, refresh }: { open?: dictionaryEntry, adding: boolean, close(): void, refresh(): void }) {
  return (
    <Modal opened={!!open} onClose={close} title={adding ? "New Entry" : "Edit Entry"}>
      {!!open&&<Content file={open} refresh={refresh} adding={adding} close={close} />}
    </Modal>
  );
}