import { ActionIcon, PasswordInput, PasswordInputProps, TextInput, TextInputProps } from "@mantine/core";
import { IconEdit, IconKey } from "@tabler/icons-react";
import { useState } from "react";

interface SecurePasswordInputProps extends PasswordInputProps {
    secure?: boolean;
    unlock?(): void;
}

export default function SecurePasswordInput({ secure, unlock, ...props}: SecurePasswordInputProps) {
    return ( secure ?
        <PasswordInput readOnly={true} value="**************"
        leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        rightSection={<ActionIcon variant="subtle" ><IconEdit onClick={()=> unlock && unlock()} size={16} style={{ display: 'block', opacity: 0.5 }} /></ActionIcon>}
        {...props}
        /> : <PasswordInput leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>} {...props}  />
    )
}
