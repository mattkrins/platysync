import { TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { IconSearch } from "@tabler/icons-react";

interface Props { form: UseFormReturnType<Rule>, name: string }
export default function LDAP( { form, name }: Props ) {
  return (
    <>
            <TextInput
            label="Search Filter"
            description={<>Searches will be refined using this <a href='https://ldap.com/ldap-filters/' target='_blank'>filter</a>.</>}
            placeholder="(objectclass=person)"
            leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }} />}
            {...form.getInputProps(`config.${name}.filter`)}
            />
    </>
  )
}
