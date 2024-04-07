import { UseFormReturnType, hasLength, isNotEmpty } from "@mantine/form";
import { TablerIconsProps, IconFileTypeCsv } from "@tabler/icons-react";
import CSV from "./Providers/CSV";

export interface provider {
    id: string;
    name: string;
    color: string;
    Icon: (props: TablerIconsProps) => JSX.Element;
    Options(props: { form: UseFormReturnType<Record<string, unknown>>; }): JSX.Element;
    Config?: (props: { form: UseFormReturnType<Rule>, name: string }) => JSX.Element;
    initialValues?: Record<string, unknown>;
    validation?: {[value: string]: (...v: unknown[]) => unknown};
}

const providers: {
    [name: string]: provider
} = {
    csv: {
        id: 'csv',
        name: "Comma-Separated Values",
        color: 'teal',
        Icon: IconFileTypeCsv,
        Options: CSV,
        initialValues: {
            name: 'MyCSV',
            path: '',
        },
        validation: {
            name: isNotEmpty('Name can not be empty.'),
            path: hasLength({ min: 2 }, 'Path must be at least 2 characters long.')
        }
    },
}

export default providers;