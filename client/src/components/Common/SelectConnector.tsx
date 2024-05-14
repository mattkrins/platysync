import { Combobox, InputBase, Input, CloseButton, useCombobox, InputWrapperProps, Group, useMantineTheme } from '@mantine/core';
import { ReactElement, useContext, useEffect, useState } from 'react';
import SchemaContext from '../../providers/SchemaContext2';
import { IconPlug } from '@tabler/icons-react';
import providers from '../Connectors/providers';

interface extConnector extends Connector {
    component?: JSX.Element;
    value?: string;
}

interface Props extends InputWrapperProps {
    clearable?: boolean;
    leftSection?: ReactElement<unknown, string>|false;
    rightSection?: ReactElement<unknown, string>|false;
    data?: string[]|{ component: JSX.Element, value: string }[];
    value?: string;
    disabled?: boolean;
    inputsOnly?: boolean;
    withinPortal?: boolean;
    type?: string;
    sources?: string[];
    placeholder?: string;
    filter?: (data: extConnector[]) => extConnector[]|{ component: JSX.Element, value: string, id: string, name: string }[];
    onChange?(value: unknown): void;
}

export default function SelectConnector({onChange, value: v2 = '', placeholder, ...props}: Props) {
    const { connectors } = useContext(SchemaContext);
    const theme = useMantineTheme();
    const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const [value, setValue] = useState<string | null>(v2||null);
    useEffect(()=>setValue(v2), [v2]);

    const providerMap = connectors.filter(c=>providers[c.id]).map(c=>({...c, provider: providers[c.id] }))

    const selected = providerMap.find(c=>c.name===v2);
    const icon = selected && <selected.provider.Icon color={theme.colors[selected.provider.color][6]} size={20} stroke={1.5} />
    let data = (providerMap||[]);
    if (props.type) data = data.filter(c=>c.id===props.type);
    if (props.inputsOnly) data = data.filter(c=>c.provider.input);
    if (props.sources) props.filter = (d) => d.filter(c=>(props.sources||[]).includes(c.name))
    const filtered = (props.filter?props.filter(data):data).map(c=>{
        const provider = providers[c.id];
        return {
            component: <Group><provider.Icon color={theme.colors[provider.color][6]} size={20} stroke={1.5} /> {c.name}</Group>,
            value: c.name
    }})

    const options = (props.data||filtered).map((item) => {
        const string = typeof item === "string";
        return (
        <Combobox.Option value={string?item:item.value as string} key={string?item:item.value}>
            {string?item:item.component}
        </Combobox.Option>
    )});
    return (
    <Input.Wrapper {...props} >
        <Combobox disabled={props.disabled||false}
        store={combobox}
        withinPortal={props.withinPortal||false}
        onOptionSubmit={(val) => {
            setValue(val);
            if (onChange) onChange(val);
            combobox.closeDropdown();
        }}
        >
        <Combobox.Target>
            <InputBase disabled={props.disabled||false}
            component="button"
            type="button"
            pointer
            leftSection={props.leftSection===false?undefined:props.leftSection?props.leftSection:
                icon ? icon : <IconPlug size={16} style={{ display: 'block', opacity: 0.5 }}/>
            }
            mt={props.label?5:undefined}
            rightSection={props.rightSection?props.rightSection:
                ((props.clearable&&value !== null) ? (
                <CloseButton
                    size="sm"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                        setValue(null);
                        if (onChange) onChange(undefined);
                    }}
                    aria-label="Clear value"
                />
                ) : (
                <Combobox.Chevron />
                ))
            }
            onClick={() => combobox.toggleDropdown()}
            rightSectionPointerEvents={ (!props.clearable || value === null) ? 'none' : 'all'}
            >
            {value || <Input.Placeholder>{placeholder||'Select Connector'}</Input.Placeholder>}
            </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
            <Combobox.Options>{options}</Combobox.Options>
        </Combobox.Dropdown>
        </Combobox>
    </Input.Wrapper>
    );
}