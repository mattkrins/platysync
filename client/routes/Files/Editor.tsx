import { Alert, Button, Group, Modal, TextInput, Text } from "@mantine/core";
import { isNotEmpty, useForm } from "@mantine/form";
import { IconUser, IconCheck, IconBraces, IconTag } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import useAPI from "../../hooks/useAPI";
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import classes from './Editor.module.css';
import { useAppDispatch, useAppSelector } from "../../providers/hooks";
import { getFiles, getName, loadFiles, mutate, undo } from "../../providers/schemaSlice";

const validate = {
  name: isNotEmpty('Name can not be empty.'),
}

export default function Editor({ editing, close, refresh }: { editing?: [psFile,boolean], close(): void, refresh(): void }) {
  const dispatch = useAppDispatch();
  const files = useAppSelector(getFiles);
  const schema_name = useAppSelector(getName);
  const [ data, setData ] = useState<FileWithPath|undefined>(undefined);
  const adding = editing && editing[0] && !editing[1];
  useEffect(()=>editing&&form.setValues(editing[0]), [ editing ]);
  const form = useForm<psFile>({ validate });
  const { data: success, put, post, loading, reset } = useAPI<unknown, FormData>({
    url: `/api/v1/schema/${schema_name}/file${adding?'':`/${editing&&editing[0].name}`}`,
    headers: { 'Content-Type': 'multipart/form-data' },
    mutateData: ()=>{
      const send = new FormData();
      send.append('file', data as FileWithPath);
      for (const key of Object.keys(form.values)) send.append(key, form.values[key as keyof psFile] as string);
      return send;
    },
    before: () => { if (!editing) return;
      const xFiles = [...(files||[])].filter(f=>f.name!==editing[0].name);
      xFiles.push(form.values);
      dispatch(mutate({files:xFiles}));
    },
    validate: () => { form.validate(); return !form.isValid(); },
    then: () => dispatch(loadFiles(schema_name)),
    catch: (_, errors) => {
      form.setErrors(errors as {});
      dispatch(undo());
    },
  });
  const onClose = () => { close(); reset(); }
  const onDrop = (files: FileWithPath[]) => {
    if (files.length > 1) return;
    setData(files[0]);
    const data = new FormData();
    data.append('file', files[0]);
  }
  return (
    <Modal opened={!!editing} onClose={onClose} title={adding ? "New File" : "Edit File"}>
      {!!success&&<Alert mb="xs" icon={<IconCheck size={32} />} color="green">File {adding ? "uploaded" : "updated"} successfully.</Alert>}
      {editing&&
      <>
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
        <Dropzone onDrop={onDrop} className={classes.root} maxFiles={1} multiple={false} >
            <Text ta="center">{data?data.path:'Drop file here'}</Text>
        </Dropzone>
      </>}
      <Group justify='flex-end' mt="md">
            <Button loading={loading} onClick={()=>adding?post():put()}>{adding ? "Upload" : "Save"}</Button>
      </Group>
    </Modal>
  )
}
