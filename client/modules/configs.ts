import { IconProps, Icon, IconCloudDownload, IconMailForward } from "@tabler/icons-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { actionConfigProps, actionProps } from "./actions";
import { isNotEmpty } from "@mantine/form";
import API from "../routes/Rules/Editor/configs/API";
import EMAIL from "../routes/Rules/Editor/configs/EMAIL";

export interface availableConfig {
    name: string;
    label?: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    color?: string;
    Options?(props: actionConfigProps): JSX.Element;
    initialValues?: Record<string, unknown>;
    validate?: {[value: string]: (...v: unknown[]) => unknown};
}

export const availableConfigs: availableConfig[] = [
    {
        name: "TransAPIGet",
        label: "API GET Request",
        Icon: IconCloudDownload,
        color: 'red',
        Options: API,
        initialValues: {
            auth: 'none',
        },
        validate: {
            endpoint: isNotEmpty('Endpoint can not be empty.'),
        },
    },
    {
        name: "TransEmailSend",
        label: "Send Email",
        Icon: IconMailForward,
        color: 'grape',
        Options: EMAIL,
        validate: {
            host: isNotEmpty('Host can not be empty.'),
            username: isNotEmpty('Username can not be empty.'),
            password: isNotEmpty('Password can not be empty.'),
        },
    },
]