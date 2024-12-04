import { Checkbox } from '@mantine/core';
import { operationProps } from '../operations';

export default function LdapUpdateAccount( { props }: operationProps ) {
    return (
    <>
        <Checkbox mt="md" label="Disabled" description="The user account is disabled."
        {...props(`ACCOUNTDISABLE`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="Password doesn't expire" description="Represents the password, which should never expire on the account."
        {...props(`DONT_EXPIRE_PASSWD`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="Require smartcard" description="When this flag is set, it forces the user to log on by using a smart card."
        {...props(`SMARTCARD_REQUIRED`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="Require home folder" description="The home folder is required."
        {...props(`HOMEDIR_REQUIRED`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="Password expired" description="Password is expired. Prompt user to update."
        {...props(`PASSWORD_EXPIRED`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="PreAuth not required" description="This account doesn't require Kerberos pre-authentication for logging on."
        {...props(`DONT_REQUIRE_PREAUTH`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="Trusted for delegation" description="The account is trusted for delegation."
        {...props(`TRUSTED_FOR_DELEGATION`, { type: 'checkbox' })}
        />
        <Checkbox mt="xs" label="Trusted for delegation auth" description="The account trusted to auth with delegation."
        {...props(`TRUSTED_TO_AUTH_FOR_DELEGATION`, { type: 'checkbox' })}
        />
    </>
  )
}
