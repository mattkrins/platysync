import { UseFormReturnType, hasLength, isNotEmpty } from "@mantine/form";
import { TablerIconsProps, IconFileTypeCsv, IconBinaryTree2, IconSchool, IconNetwork, IconFolder, IconMail } from "@tabler/icons-react";
import CSV from "./Providers/CSV";
import LDAP from "./Providers/LDAP";
import STMC from "./Providers/STMC";
import PROXY from "./Providers/PROXY";
import LDAPConfig from "../Rules/Editor/Providers/LDAP";
import STMCConfig from "../Rules/Editor/Providers/STMC";
import FOLDER from "./Providers/FOLDER";
import EMAIL from "./Providers/EMAIL";

export interface provider {
    id: string;
    name: string;
    color: string;
    input: boolean;
    Icon: (props: TablerIconsProps) => JSX.Element;
    Options(props: { form: UseFormReturnType<Record<string, unknown>>, editing?: boolean }): JSX.Element;
    Config?: (props: { form: UseFormReturnType<Rule>, name: string }) => JSX.Element;
    initialValues?: Record<string, unknown>;
    validation?: {[value: string]: (...v: unknown[]) => unknown};
}

const providers: {
    [name: string]: provider
} = {
    csv: {
        id: 'csv',
        name: "Comma-Separated Values (CSV)",
        color: 'teal',
        Icon: IconFileTypeCsv,
        Options: CSV,
        input: true,
        initialValues: {
            name: 'MyCSV',
            path: '',
        },
        validation: {
            name: isNotEmpty('Name can not be empty.'),
            path: hasLength({ min: 2 }, 'Path must be at least 2 characters long.'),
        },
    },
    ldap: {
        id: 'ldap',
        name: "Lightweight Directory Access Protocol (LDAP)",
        color: 'blue',
        Icon: IconBinaryTree2,
        Options: LDAP,
        Config: LDAPConfig,
        input: true,
        initialValues: {
            name: 'ActiveDirectory',
            url: '',
            username: '',
            password: '',
            base: '',
            attributes: [],
        },
        validation: {
            name: isNotEmpty('Name can not be empty.'),
            url: hasLength({ min: 3 }, 'URL must be at least 3 characters long.'),
            username: isNotEmpty('Username can not be empty.'),
            password: isNotEmpty('Password can not be empty.'),
        },
    },
    stmc: {
        id: 'stmc',
        name: "eduSTAR Management Centre (STMC)",
        color: 'yellow',
        Icon: IconSchool,
        Options: STMC,
        Config: STMCConfig,
        input: true,
        initialValues: {
            name: '',
            username: '',
            password: '',
            school: '',
            cache: 1440,
        },
        validation: {
            name: isNotEmpty('Name can not be empty.'),
            username: isNotEmpty('Username can not be empty.'),
            password: isNotEmpty('Password can not be empty.'),
            school: isNotEmpty('School ID can not be empty.'),
        },
    },
    folder: {
        id: 'folder',
        name: "System Folder",
        color: 'lime',
        Icon: IconFolder,
        Options: FOLDER,
        input: true,
        initialValues: {
            name: '',
            path: '',
        },
        validation: {
            name: isNotEmpty('Name can not be empty.'),
            path: hasLength({ min: 2 }, 'Path must be at least 2 characters long.'),
        },
    },
    //api: {
    //    id: 'api',
    //    name: "Web API",
    //    color: 'red',
    //    Icon: IconCloudComputing,
    //    Options: API,
    //    input: true,
    //    initialValues: {
    //        name: '',
    //        endpoint: '',
    //        append: '',
    //        bearer: '',
    //        basic: '',
    //    },
    //    validation: {
    //        name: isNotEmpty('Name can not be empty.'),
    //        path: hasLength({ min: 2 }, 'Path must be at least 2 characters long.'),
    //    },
    //},
    email: {
        id: 'email',
        name: "Email Sender",
        color: 'grape',
        Icon: IconMail,
        Options: EMAIL,
        input: false,
        initialValues: {
            name: 'EmailServer',
            type: 'smtp',
            host: '',
            username: '',
            password: '',
        },
        validation: {
            name: isNotEmpty('Name can not be empty.'),
            host: hasLength({ min: 3 }, 'URL must be at least 3 characters long.')
        },
    },
    proxy: {
        id: 'proxy',
        name: "Corporate Proxy Server",
        color: 'gray',
        Icon: IconNetwork,
        Options: PROXY,
        input: false,
        initialValues: {
            name: 'ProxyServer',
            url: '',
            username: '',
            password: '',
        },
        validation: {
            name: isNotEmpty('Name can not be empty.'),
            url: hasLength({ min: 3 }, 'URL must be at least 3 characters long.')
        },
    },
}

export default providers;