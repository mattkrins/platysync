import { TextInput, SimpleGrid, Anchor, Text, NumberInput } from "@mantine/core";
import { IconClock, IconFolder, IconSchool, IconSearch, IconServer, IconTableColumn, IconUser, IconWorld } from "@tabler/icons-react";
import { UseFormReturnType } from "@mantine/form";
import SecurePasswordInput from "../../../components/SecurePasswordInput";
import { ldap_options } from "../../../../server/components/providers/LDAP";
import Concealer from "../../../components/Concealer";
import SelectConnector from "../../../components/SelectConnector";

export default function STMC( { form }: { form: UseFormReturnType<Connector|ldap_options> } ) {
    return (
    <>
        <SimpleGrid mt="sm" cols={{ base: 1, sm: 2 }} >
            <TextInput withAsterisk
                label="Username"
                placeholder="ST01235"
                leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                {...form.getInputProps('username')}
            />
            <SecurePasswordInput withAsterisk
            label="Password"
            placeholder="password"
            secure={!!form.values.password&&typeof form.values.password !== 'string'}
            unlock={()=>form.setFieldValue("password", "")}
            {...form.getInputProps('password')}
            />
        </SimpleGrid>
        <TextInput mt="sm"
            label="School Identification Number"
            leftSection={<IconSchool size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="1234"
            withAsterisk {...form.getInputProps('school')}
        />
        <SelectConnector mt="sm"
        {...form.getInputProps('eduhub')} ids={["csv"]} clearable
        label="Match Eduhub" description="Match against eduhub making the _stkey header available."
        />
        <Concealer>
            <NumberInput mt="sm"
                label="Caching Policy"
                description="Minutes to wait before invalidating downloaded cache."
                leftSection={<IconClock size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="1440 (1 day)"
                {...form.getInputProps('cache')}
            />
        </Concealer>
    </>);
}