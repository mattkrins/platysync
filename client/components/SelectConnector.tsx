import { useCombobox, Combobox, InputBase, Input, Group, Text, InputBaseProps, useMantineTheme, CloseButton } from '@mantine/core';
import { useSelector } from '../hooks/redux';
import { getConnectors } from '../providers/schemaSlice';
import { ForwardRefExoticComponent, RefAttributes, useMemo } from 'react';
import { provider, providers } from '../modules/providers';
import { Icon, IconPlug, IconProps } from '@tabler/icons-react';


interface Item extends Connector, provider {}

interface Props extends InputBaseProps {
    value?: string;
    onChange(value: string|null): void;
    Icon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>
    connector?: string;
    placeholder?: string;
    withinPortal?: boolean;
    clearable?: boolean;
    provider?: boolean;
    names?: string[];
    ids?: string[];
    removeNames?: string[];
    removeIds?: string[];
}

function SelectOption({ name, cName, Icon, color, inactive }: Item&{ inactive?: boolean, cName?: string }  ) {
    const theme = useMantineTheme();
    return (
    <Group>
        <Icon size={inactive?26:20} color={color?theme.colors[color][6]:undefined} />
        <div>
            <Text fz="sm" fw={500}>
                {cName}
            </Text>
            {inactive&&<Text fz="xs" opacity={0.6}>
                {name}    
            </Text>}
        </div>
    </Group>
    );
}

export default function SelectConnector( { value, onChange, Icon, placeholder, clearable, provider, names, ids, removeNames, removeIds, ...props }: Props ) {
    const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption(), });
    const connectors = useSelector(getConnectors);    
    const proConnectors = useMemo(()=>connectors.map(({name, ...c})=>({ ...(providers.find(p=>p.id===c.id) as provider), ...c, cName: name })),[ connectors ]);
    const selectedOption = proConnectors.find((item) => item.cName === value);
    const contextualised = useMemo(()=>{
        let context = proConnectors;
        if (names) context = context.filter(c=>names.includes(c.cName));
        if (ids) context = context.filter(c=>ids.includes(c.id));
        if (provider) context = context.filter(c=>c.type==="provider");
        if (removeNames) context = context.filter(c=>!removeNames.includes(c.cName));
        if (removeIds) context = context.filter(c=>!removeIds.includes(c.id));
        return context;
    },[ proConnectors, provider, names, ids, removeNames, removeIds ]);
    const options = contextualised.map((item) => (
        <Combobox.Option value={item.cName} key={item.cName}>
            <SelectOption {...item} inactive />
        </Combobox.Option>
    ));
    return (
    <Combobox
        disabled={props.disabled||options.length<=0}
        store={combobox}
        withinPortal={props.withinPortal||false}
        onOptionSubmit={(val) => {
            onChange(val);
            combobox.closeDropdown();
        }}
    >
        <Combobox.Target>
        <InputBase
            component="button"
            type="button"
            pointer
            leftSection={ selectedOption ? undefined : props.leftSection===false?undefined:props.leftSection?props.leftSection:
                Icon ? <Icon size={16} style={{ display: 'block', opacity: 0.5 }}/> : <IconPlug size={16} style={{ display: 'block', opacity: 0.5 }}/>
            }
            rightSection={
                (clearable && value !== null) ? ( props.disabled ? undefined :
                  <CloseButton
                    size="sm"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onChange(null)}
                    aria-label="Clear value"
                  />
                ) : (
                  <Combobox.Chevron />
                )
              }
            onClick={() => options.length<=0 ? undefined : combobox.toggleDropdown()}
            rightSectionPointerEvents={(!clearable || value === null) ? 'none' : 'all'}
            multiline
            { ...props }
        >
            {selectedOption ? (
                <SelectOption {...selectedOption} />
            ) : (
                <Input.Placeholder>{placeholder?placeholder:'Select Connector'}</Input.Placeholder>
            )}
        </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
        <Combobox.Options>{options}</Combobox.Options>
        </Combobox.Dropdown>
    </Combobox>
    );
}