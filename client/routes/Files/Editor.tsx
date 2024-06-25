import { Alert, Button, Group, Modal, TextInput, Text, Input, CloseButton } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { IconCheck, IconBraces, IconTag, IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import useAPI from "../../hooks/useAPI";
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import classes from './Editor.module.css';
import { useAppDispatch, useAppSelector } from "../../providers/hooks";
import { getName, undo } from "../../providers/schemaSlice";

const validate = {
  name: isNotEmpty('Name can not be empty.'),
}

function Content({ initialValues, refresh, adding }: { initialValues: psFile, refresh(): void, adding: boolean }) {
  const editing = initialValues.name;
  const form = useForm<psFile>({ validate, initialValues });
  const dispatch = useAppDispatch();
  const schema_name = useAppSelector(getName);
  const [ data, setData ] = useState<FileWithPath|undefined>(undefined);
  const { data: success, put, post, loading, reset, error } = useAPI<psFile, FormData>({
    url: `/api/v1/schema/${schema_name}/file${adding?'':`/${editing}`}`,
    headers: { 'Content-Type': 'multipart/form-data' },
    mutateData: ()=>{
      const send = new FormData();
      send.append('file', data as FileWithPath);
      send.append('name', form.values.name);
      send.append('key', form.values.key as string);
      return send;
    },
    validate: () => { form.validate(); return !form.isValid(); },
    then: () => refresh(),
    catch: (_, errors) => {
      form.setErrors(errors as {});
      dispatch(undo());
    },
  });
  const onDrop = (files: FileWithPath[]) => {
    if (files.length > 1) return;
    setData(files[0]);
    const data = new FormData();
    data.append('file', files[0]);
  }
  return (<>
    {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">File {adding ? "uploaded" : "updated"} successfully.</Alert>}
    {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
    <TextInput
    label="Name" pb="xs"
    placeholder="key" required
    {...form.getInputProps('name')}
    leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
    />
    <TextInput
    label="Template Key" pb="xs"
    description="Used by templating system. Key 'path' becomes {{$file.path}}"
    placeholder="Defaults to name"
    {...form.getInputProps('key')}
    leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.5 }}/>}
    />
    <Input.Wrapper label={adding ? "File" : "Replace File"} required={adding} error={form.getInputProps('path').error} >
        <Dropzone mb="xs" onDrop={onDrop} className={classes.root} maxFiles={1} multiple={false} >
            <Text ta="center">{data?<>{data.path} <CloseButton size="xs" onClick={()=>setData(undefined)} /></>:'Drop file here'}</Text>
        </Dropzone>
    </Input.Wrapper>
    {initialValues.path&&<Text size="sm">Current File</Text>}
    {initialValues.path&&<Text size="xs" c="dimmed" >{initialValues.path}</Text>}
    <Group justify='flex-end' mt="md">
          <Button loading={loading} onClick={()=>adding?post():put()}>{adding ? "Upload" : "Save"}</Button>
    </Group>
  </>)
}

export default function Editor({ editing, close, refresh }: { editing?: [psFile,boolean], close(): void, refresh(): void }) {
  const adding = (editing && editing[0] && !editing[1]) || false ;
  return (
    <Modal opened={!!editing} onClose={close} title={adding ? "New File" : "Edit File"}>
      {editing&&<Content initialValues={editing[0]} refresh={refresh} adding={adding} />}
    </Modal>
  );
}