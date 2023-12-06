import { Button, Group, Modal } from "@mantine/core";
import providers from "../../modules/connectors";
import { UseFormReturnType, useForm } from "@mantine/form";
import { defaults, validators } from '../../modules/validators.ts';
import { useContext, useEffect } from "react";
import useAPI from "../../hooks/useAPI.ts";
import { notifications } from "@mantine/notifications";
import SchemaContext from "../../providers/SchemaContext.tsx";
import CSV from "./Providers/CSV";
import LDAP from "./Providers/LDAP.tsx";
import PROXY from "./Providers/PROXY.tsx";
import STMC from "./Providers/STMC.tsx";

function Switcher({ provider, form, editing }: { provider: string, form: UseFormReturnType<Record<string, unknown>>, editing: Connector|undefined }){
  switch (provider) {
    case "csv": return <CSV form={form} />
    case "ldap": return <LDAP form={form} editing={editing} />
    case "proxy": return <PROXY form={form} editing={editing} />
    case "stmc": return <STMC form={form} editing={editing} />
    default: return <>Invalid Provider.</>
  }
}

export default function EditConnector({ editing, adding, close }: { editing: Connector|undefined, adding: string | undefined, close(): void }) {
  const { schema, mutate } = useContext(SchemaContext);
  const provider = adding ? providers[adding] :  editing ? providers[editing.id] : { id:'', name: '' };
  const initialValues = defaults[provider.id] || {};
  const validate = validators[provider.id] || {};
  const form = useForm({ initialValues, validate });
  useEffect(()=>{
    form.reset();
    if (editing) {form.setValues(editing as never)} else {form.setValues(initialValues); }
    form.setInitialValues(initialValues);
  }, [ editing, adding ])

  const { post: add, loading: l1 } = useAPI({
      url: `/schema/${schema?.name}/connector`,
      data: {...form.values, id: provider.id },
      before: () => form.validate(),
      check: () => !form.isValid(),
      catch: ({validation}) => form.setErrors(validation),
      then: ({connectors, _connectors, headers}) => {
        mutate({connectors, _connectors, headers});
        close();
        notifications.show({ title: "Success",message: 'Connector Added.', color: 'lime', });
      }
  });

  const { put, loading: l2 } = useAPI({
    url: `/schema/${schema?.name}/connector`,
    data: {...form.values, id: provider.id },
    before: () => form.validate(),
    check: () => !form.isValid(),
    catch: ({validation}) => form.setErrors(validation),
    then: ({connectors, _connectors, headers}) => {
      mutate({connectors, _connectors, headers});
      close();
      notifications.show({ title: "Success",message: 'Connector Saved.', color: 'lime', });
    }
  });

  const edit = () => put({append_url: `/${editing?.name}`});

  const loading = l1||l2;

  return (
    <Modal size="lg" opened={!!editing||!!adding} onClose={close} title={provider.name} >
        <Switcher provider={provider.id} form={form} editing={editing} />
        <Group justify="right" mt="md"><Button loading={loading} onClick={editing?edit:add} variant="light" type="submit" >{editing?'Save':'Add'}</Button></Group>
    </Modal>
  )
}
