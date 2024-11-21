import { TextInput, SimpleGrid, Anchor, Text } from "@mantine/core";
import { IconFolder, IconSearch, IconServer, IconTableColumn, IconUser, IconWorld } from "@tabler/icons-react";
import SecurePasswordInput from "../../../components/SecurePasswordInput";
import Concealer from "../../../components/Concealer";
import { contextConfig, providerConfig } from "../../../modules/providers";
import useRule from "../../../hooks/useRule";

export default function LDAP( { props }: providerConfig ) {
    return (
    <>
        <TextInput mt="sm"
            label="Target URL"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="ldaps://10.10.1.1:636"
            withAsterisk {...props("url")}
        />
        <SimpleGrid mt="sm" cols={{ base: 1, sm: 2 }} >
            <TextInput withAsterisk
                label="Username"
                leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="domain\administrator"
                {...props("username")}
            />
            <SecurePasswordInput withAsterisk
            label="Password"
            placeholder="User Password"
            {...props("password", { type: "password" })}
            />
        </SimpleGrid>
        <TextInput mt="sm"
            label="Header Target"
            description={<><Text size="xs" c="red" >Recommended</Text>Path to a user/object used to improve auto-detection of headers.</>}
            leftSection={<IconTableColumn size={16} style={{ display: 'block', opacity: 0.5 }} />}
            placeholder="cn=user,c=sub,dc=domain,dc=com"
            {...props("target")}
        />
        <Concealer>
            <TextInput mt="xs"
                label="Root DSE"
                description="All distinguished names, including the Base Organizational Unit, will be appended by this path."
                leftSection={<IconServer size={16} style={{ display: 'block', opacity: 0.5 }} />}
                placeholder="dc=sub,dc=domain,dc=com"
                {...props("dse")}
            />
            <TextInput mt="xs"
                label="Base OU"
                description="All search paths will be prepended by this path."
                leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.5 }} />}
                placeholder="ou=staff,ou=users"
                {...props("ou")}
            />
            <TextInput mt="xs"
            label="Search Filter"
            description={<>All searches will be refined using this <Anchor href='https://ldap.com/ldap-filters/' size="xs" target='_blank' >filter</Anchor>.</>}
            leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }} />}
            placeholder="(objectclass=person)"
            {...props("filter")}
            />
        </Concealer>
    </>);
}

export function LDAPContext( { props, rule }: providerConfig ) {
    const { displayExample } = useRule(rule as Rule);
    return (
    <>
        <TextInput mt="sm"
        label="User Search Filter"
        description={<>The <Anchor href='https://ldap.com/ldap-filters/' size="xs" target='_blank' >filter</Anchor> used to search for / target individual users.</>}
        leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }} />}
        {...props("userFilter", { placeholder: `( &(objectclass=person) ( sAMAccountName=${displayExample} ) )` })}
        />
    </>);
}
