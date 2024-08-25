import { ActionIcon, PasswordInput, PasswordInputProps } from "@mantine/core";
import { IconEdit, IconKey } from "@tabler/icons-react";

interface SecurePasswordInputProps extends PasswordInputProps {
    secure?: boolean;
    rightSectionX?: JSX.Element;
    unlock?(): void;
}

export default function SecurePasswordInput({ secure, unlock, rightSectionX,  ...props}: SecurePasswordInputProps) {
    return ( secure ?
        <PasswordInput readOnly={true} value="**************"
        leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        rightSection={<ActionIcon variant="subtle" ><IconEdit onClick={()=> unlock && unlock()} size={16} style={{ display: 'block', opacity: 0.5 }} /></ActionIcon>}
        {...props}
        /> : <PasswordInput leftSection={<IconKey size={16} style={{ display: 'block', opacity: 0.5 }}/>} {...props} rightSection={props.rightSection ? props.rightSection : rightSectionX} />
    )
}
