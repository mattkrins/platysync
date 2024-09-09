import { ActionIcon } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useMemo } from "react";

export default function usePassword(form: UseFormReturnType<any>, path: string) {
    const [visible, { toggle, open, close }] = useDisclosure(false);
    const EyeIcon = useMemo(()=><ActionIcon onClick={toggle} variant="subtle">{!visible ?
        <IconEye style={{ width: 'var(--psi-icon-size)', height: 'var(--psi-icon-size)' }} /> :
        <IconEyeOff style={{ width: 'var(--psi-icon-size)', height: 'var(--psi-icon-size)' }} />}
    </ActionIcon>,[ visible, toggle ]);
    const password = form.getInputProps(path);
    const secure = !!password.value && typeof password.value !== 'string';
    const unlock = () => form.setFieldValue(path, "")
    return { visible, options: { buttons: EyeIcon, placeholder: "**************" }, secure, password, unlock, toggle, hide: close, show: open };
}