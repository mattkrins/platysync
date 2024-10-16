import { TextInput, SimpleGrid, Anchor, Text } from "@mantine/core";
import { IconFolder, IconSearch, IconServer, IconTableColumn, IconUser, IconWorld } from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import SecurePasswordInput from "../../../components/SecurePasswordInput";
import { ldap_options } from "../../../../server/components/providers/LDAP";
import Concealer from "../../../components/Concealer";
import useTemplater from "../../../hooks/useTemplater";
import { ContextProps } from "../../../modules/providers";
import { useRule } from "../../Rules/Editor/Editor";

export default function LDAP( { form, path }: { form: UseFormReturnType<Connector|ldap_options>, path?: string } ) {
    return (
    <>
        <TextInput mt="sm"
            label="Target URL"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="ldaps://10.10.1.1:636"
            withAsterisk {...form.getInputProps(`${path||''}url`)}
        />
        <SimpleGrid mt="sm" cols={{ base: 1, sm: 2 }} >
            <TextInput withAsterisk
                label="Username"
                placeholder="domain\administrator"
                leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                {...form.getInputProps(`${path||''}username`)}
            />
            <SecurePasswordInput withAsterisk
            label="Password"
            placeholder="password"
            secure={!!form.values.password&&typeof form.values.password !== 'string'}
            unlock={()=>form.setFieldValue(`${path||''}password`, "")}
            {...form.getInputProps(`${path||''}password`)}
            />
        </SimpleGrid>
        <TextInput mt="sm"
            label="Header Target"
            description={<><Text size="xs" c="red" >Recommended</Text>Path to a user/object used to improve auto-detection of headers.</>}
            placeholder="cn=user,c=sub,dc=domain,dc=com"
            leftSection={<IconTableColumn size={16} style={{ display: 'block', opacity: 0.5 }} />}
            {...form.getInputProps(`${path||''}target`)}
        />
        <Concealer>
            <TextInput mt="xs"
                label="Root DSE"
                description="All distinguished names, including the Base Organizational Unit, will be appended by this path."
                placeholder="dc=sub,dc=domain,dc=com"
                leftSection={<IconServer size={16} style={{ display: 'block', opacity: 0.5 }} />}
                {...form.getInputProps(`${path||''}dse`)}
            />
            <TextInput mt="xs"
                label="Base OU"
                description="All search paths will be prepended by this path."
                placeholder="ou=staff,ou=users"
                leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.5 }} />}
                {...form.getInputProps(`${path||''}ou`)}
            />
            <TextInput mt="xs"
            label="Search Filter"
            description={<>All searches will be refined using this <Anchor href='https://ldap.com/ldap-filters/' size="xs" target='_blank' >filter</Anchor>.</>}
            placeholder="(objectclass=person)"
            leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }} />}
            {...form.getInputProps(`${path||''}filter`)}
            />
        </Concealer>
    </>);
}

export function LDAPContext( { form, sources, rule, path }: ContextProps ) {
    const { templateProps, explorer } = useTemplater({names:sources});
    const { displayExample } = useRule(rule);
    return (
    <>  {explorer}
        <TextInput mt="sm"
        label="User Search Filter"
        description={<>The <Anchor href='https://ldap.com/ldap-filters/' size="xs" target='_blank' >filter</Anchor> used to search for / target individual users.</>}
        placeholder={`(&(objectclass=person)(sAMAccountName=${displayExample}))`}
        leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }} />}
        {...templateProps(form, path ? `${path}.userFilter` : 'userFilter' )}
        />
    </>);
}
