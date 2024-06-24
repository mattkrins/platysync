import { Alert, Button, Group, Modal, TextInput, Text } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { IconUser, IconCheck } from "@tabler/icons-react";
import { useEffect } from "react";
import useAPI from "../../hooks/useAPI";
import { Dropzone } from '@mantine/dropzone';
import classes from './Editor.module.css';

const validate = {
  name: isNotEmpty('Name can not be empty.'),
}

export default function Editor({ editing, close, refresh }: { editing?: [xFile,boolean], close(): void, refresh(): void }) {
  const adding = editing && editing[0] && !editing[1];
  useEffect(()=>editing&&form.setValues(editing[0]), [ editing ]);
  const form = useForm<xFile>({ validate });
  const { data: success, put, post, loading, reset } = useAPI<unknown, xFile>({
    url: `/api/v1/user${adding?'':`/${editing&&editing[0].name}`}`, form,
    then: () => refresh(),
  });
  const onClose = () => { close(); reset(); }
  return (
    <Modal opened={!!editing} onClose={onClose} title={adding ? "New File" : "Edit File"}>
      {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">User {adding ? "created" : "saved"} successfully.</Alert>}
      {editing&&
      <>
        <TextInput
        label="Username"
        placeholder="john.smith" required
        {...form.getInputProps('username')}
        leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        />

        <Dropzone onDrop={() => {}} className={classes.root} >
            <Text ta="center">Drop images here</Text>
        </Dropzone>

      </>}
      <Group justify='flex-end' mt="md">
            <Button loading={loading} onClick={()=>adding?post():put()}>{adding ? "Upload" : "Save"}</Button>
      </Group>
    </Modal>
  )
}
