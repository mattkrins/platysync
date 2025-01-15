import { Alert, Button, Group, Modal, PasswordInput, TextInput } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { IconUser, IconKey, IconCheck } from "@tabler/icons-react";
import { useEffect } from "react";
import useAPI from "../../../hooks/useAPI";

const validate = {
  username: isNotEmpty('Username can not be empty.'),
}

export default function Editor({ editing, close, refresh }: { editing?: [User,boolean], close(): void, refresh(): void }) {
  const adding = editing && editing[0] && !editing[1];
  useEffect(()=>editing&&form.setValues(editing[0]), [ editing ]);
  const form = useForm<User>({ validate });
  const { data: success, put, post, loading, reset } = useAPI<unknown, User>({
    url: `/user${adding?'':`/${editing&&editing[0].username}`}`, form,
    then: () => refresh(),
  });
  const onClose = () => { close(); reset(); }
  return (
    <Modal opened={!!editing} onClose={onClose} title={adding ? "New User" : "Edit User"}>
      {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">User {adding ? "created" : "saved"} successfully.</Alert>}
      {editing&&
      <>
        <TextInput
        label="Username"
        placeholder="john.smith" required
        {...form.getInputProps('username')}
        leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        />
        <PasswordInput mt="xs"
        label="Password"
        placeholder="password" required={adding}
        leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        {...form.getInputProps('password')}
        />
        <PasswordInput mt="xs"
        label="Confirm Password"
        placeholder="password" required={adding}
        leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        {...form.getInputProps('confirm')}
        />
      </>}
      <Group justify='flex-end' mt="md">
            <Button loading={loading} onClick={()=>adding?post():put()}>{adding ? "Create" : "Save"}</Button>
      </Group>
    </Modal>
  )
}
