import { TextInput, SimpleGrid, Anchor, Text } from "@mantine/core";
import { IconFolder, IconSearch, IconServer, IconTableColumn, IconUser, IconWorld } from "@tabler/icons-react";
import SecurePasswordInput from "../../../components/SecurePasswordInput";
import Concealer from "../../../components/Concealer";
import useTemplater from "../../../hooks/useTemplater";
import { ContextProps, providerConfig } from "../../../modules/providers";
import { useRule } from "../../Rules/Editor/Editor";

export default function LDAP( { props }: providerConfig ) {
    return (
    <>
        <TextInput mt="sm"
            label="Target URL"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            withAsterisk {...props("url", { placeholder: "ldaps://10.10.1.1:636" })}
        />
        <SimpleGrid mt="sm" cols={{ base: 1, sm: 2 }} >
            <TextInput withAsterisk
                label="Username"
                leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                {...props("username", { placeholder: "domain\administrator" })}
            />
            <SecurePasswordInput withAsterisk
            label="Password"
            {...props("password", { type: "password", placeholder: "User Password" })}
            />
        </SimpleGrid>
        <TextInput mt="sm"
            label="Header Target"
            description={<><Text size="xs" c="red" >Recommended</Text>Path to a user/object used to improve auto-detection of headers.</>}
            leftSection={<IconTableColumn size={16} style={{ display: 'block', opacity: 0.5 }} />}
            {...props("target", { placeholder: "cn=user,c=sub,dc=domain,dc=com" })}
        />
        <Concealer>
            <TextInput mt="xs"
                label="Root DSE"
                description="All distinguished names, including the Base Organizational Unit, will be appended by this path."
                leftSection={<IconServer size={16} style={{ display: 'block', opacity: 0.5 }} />}
                {...props("dse", { placeholder: "dc=sub,dc=domain,dc=com" })}
            />
            <TextInput mt="xs"
                label="Base OU"
                description="All search paths will be prepended by this path."
                leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.5 }} />}
                {...props("ou", { placeholder: "ou=staff,ou=users" })}
            />
            <TextInput mt="xs"
            label="Search Filter"
            description={<>All searches will be refined using this <Anchor href='https://ldap.com/ldap-filters/' size="xs" target='_blank' >filter</Anchor>.</>}
            leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }} />}
            {...props("filter", { placeholder: "(objectclass=person)" })}
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
