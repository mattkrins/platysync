import { Alert, Button, Group, Modal, TextInput, Text, Input, CloseButton } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { IconCheck, IconBraces, IconTag, IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import useAPI from "../../hooks/useAPI";
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import classes from './Editor.module.css';
import { download } from "../../modules/common";

const validate = {
  name: isNotEmpty('Name can not be empty.'),
}

function Content({ file, refresh, adding }: { file: psFile, refresh(): void, adding: boolean }) {
  const editing = file.name;
  const form = useForm<psFile>({ validate, initialValues: file });
  const [ data, setData ] = useState<FileWithPath|undefined>(undefined);
  const { data: success, put, post, loading, error, schema_name } = useAPI<psFile, FormData>({
    url: `/file${adding?'':`/${editing}`}`, schema: true,
    headers: { 'Content-Type': 'multipart/form-data' },
    validate: () => { form.validate(); return !form.isValid(); },
    mutateData: ()=>{
      const send = new FormData();
      send.append('file', data as FileWithPath);
      send.append('name', form.values.name);
      send.append('key', form.values.key as string);
      return send;
    },
    then: () => refresh(),
    catch: (_, errors) => form.setErrors(errors as {}),
  });
  const onDrop = (files: FileWithPath[]) => {
    if (files.length > 1) return;
    setData(files[0]);
    const data = new FormData();
    data.append('file', files[0]);
    if (!form.values.name) form.setFieldValue("name", files[0].name)
  }
  return (<>
    {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">File {adding ? "uploaded" : "updated"} successfully.</Alert>}
    {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
    <TextInput
    label="Name" pb="xs"
    placeholder="name" required
    {...form.getInputProps('name')}
    leftSection={<IconTag size={16} style={{ display: 'block', opacity: 0.5 }}/>}
    />
    <TextInput
    label="Template Key" pb="xs"
    description="Used by templating system. Key 'path' becomes {{$file.name}}"
    placeholder={form.values.name||"key"}
    {...form.getInputProps('key')}
    leftSection={<IconBraces size={16} style={{ display: 'block', opacity: 0.5 }}/>}
    />
    <Input.Wrapper label={adding ? "File" : "Replace File"} required={adding} error={form.getInputProps('path').error} >
        <Dropzone mb="xs" onDrop={onDrop} className={classes.root} maxFiles={1} multiple={false} >
            <Text ta="center">{data?<>{data.path} <CloseButton size="xs" onClick={()=>setData(undefined)} /></>:'Drop file here'}</Text>
        </Dropzone>
    </Input.Wrapper>
    {file.path&&<Text size="sm">Current File</Text>}
    {file.path&&<Text size="xs" c="dimmed" >{file.path}</Text>}
    <Group justify={adding?"flex-end":"space-between"} mt="md">
          {!adding&&<Button loading={loading} color="green" onClick={()=>download(`/schema/${schema_name}/file/${file.name}`)}>Download</Button>}
          <Button loading={loading} onClick={()=>adding?post():put()}>{adding ? "Upload" : "Save"}</Button>
    </Group>
  </>)
}

export default function Editor({ editing, close, refresh }: { editing?: [psFile,boolean], close(): void, refresh(): void }) {
  const adding = (editing && editing[0] && !editing[1]) || false ;
  return (
    <Modal opened={!!editing} onClose={close} title={adding ? "New File" : "Edit File"}>
      {editing&&<Content file={editing[0]} refresh={refresh} adding={adding} />}
    </Modal>
  );
}