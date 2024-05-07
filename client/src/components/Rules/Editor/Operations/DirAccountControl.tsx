import { Box, Checkbox } from "@mantine/core";
import { IconBinaryTree2 } from "@tabler/icons-react";
import SelectConnector from "../../../Common/SelectConnector";

export default function DirAccountControl( { form, index, actionType, sources }: ActionItem ) {
    return (
    <Box p="xs" pt={0} >
        <SelectConnector
            label="Target Directory" withAsterisk
            clearable
            leftSection={<IconBinaryTree2 size="1rem" />}
            {...form.getInputProps(`${actionType}.${index}.target`)}
            type="ldap"
            sources={sources}
        />
        <Checkbox mt="md" label="Disabled" description="The user account is disabled."
        {...form.getInputProps(`${actionType}.${index}.ACCOUNTDISABLE`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="Password doesn't expire" description="Represents the password, which should never expire on the account."
        {...form.getInputProps(`${actionType}.${index}.DONT_EXPIRE_PASSWD`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="Require smartcard" description="When this flag is set, it forces the user to log on by using a smart card."
        {...form.getInputProps(`${actionType}.${index}.SMARTCARD_REQUIRED`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="Require home folder" description="The home folder is required."
        {...form.getInputProps(`${actionType}.${index}.HOMEDIR_REQUIRED`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="Password expired" description="Password is expired. Prompt user to update."
        {...form.getInputProps(`${actionType}.${index}.PASSWORD_EXPIRED`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="PreAuth not required" description="This account doesn't require Kerberos pre-authentication for logging on."
        {...form.getInputProps(`${actionType}.${index}.DONT_REQUIRE_PREAUTH`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="Trusted for delegation" description="The account is trusted for delegation."
        {...form.getInputProps(`${actionType}.${index}.TRUSTED_FOR_DELEGATION`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="Trusted for delegation auth" description="The account trusted to auth with delegation."
        {...form.getInputProps(`${actionType}.${index}.TRUSTED_TO_AUTH_FOR_DELEGATION`, { type: 'checkbox' })}
        />
    </Box>
    )
}
