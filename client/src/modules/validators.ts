import { hasLength, isNotEmpty } from "@mantine/form";

export const defaults: { [name: string]: Record<string, unknown> } = {
    csv: {
        name: 'MyCSV',
        path: '',
    },
    proxy: {
        name: 'ProxyServer',
        url: '',
        username: '',
        password: ''
    },
    ldap: {
        name: 'ActiveDirectory',
        url: '',
        username: '',
        password: '',
        base: '',
        attributes: []
    },
    stmc: {
        name: '',
        username: '',
        password: '',
        school: '',
        cache: 1440
    }
}

export const validators: {
    [name: string]: {
        [value: string]: (...v: unknown[]) => unknown
    }
} = {
    csv: {
        name: isNotEmpty('Name can not be empty.'),
        path: hasLength({ min: 2 }, 'Path must be at least 2 characters long.')
    },
    proxy: {
        name: isNotEmpty('Name can not be empty.'),
        url: hasLength({ min: 3 }, 'URL must be at least 3 characters long.')
    },
    ldap: {
        name: isNotEmpty('Name can not be empty.'),
        url: hasLength({ min: 3 }, 'URL must be at least 3 characters long.'),
        username: isNotEmpty('Username can not be empty.'),
        password: isNotEmpty('Password can not be empty.')
    },
    stmc: {
        name: isNotEmpty('Name can not be empty.'),
        username: isNotEmpty('Username can not be empty.'),
        password: isNotEmpty('Password can not be empty.'),
        school: isNotEmpty('School ID can not be empty.')
    }
}