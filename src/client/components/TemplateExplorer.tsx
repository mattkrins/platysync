import { Box, Button, CloseButton, Drawer, Flex, Group, Text, TextInput, UnstyledButton } from '@mantine/core'
import { useTemplater } from '../context/TemplateContext';
import { ForwardRefExoticComponent, RefAttributes, useMemo, useState } from 'react';
import { Icon, IconChevronRight, IconFiles, IconProps, IconSearch } from '@tabler/icons-react';
import classes from './TemplateExplorer.module.css';
import { useSelector } from '../hooks/redux';
import { getFiles } from '../providers/schemaSlice';
import useTemplate from '../hooks/useTemplate';


type Template = {
    [k: string]: string | { [k: string]: string };
};

function flattenTemplate(template: Template): string[] {
    const result: string[] = [];
    function flatten(obj: Template, prefix: string = '') {
        for (const key in obj) {
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === 'string') {
                result.push(newKey);
            } else {
                flatten(obj[key] as Template, newKey);
            }
        }
    }
    flatten(template);
    return result;
}

interface SectionProps {
    onClick(): void;
    open?: boolean;
    label: string;
    color?: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    Ricon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
}

function Section({ onClick, open, label, color, Icon, Ricon }: SectionProps ) {
    return (
    <UnstyledButton onClick={onClick} className={classes.connector} p="xs" mt="xs" >
    <Group>
        <Box style={{ display: 'flex', alignItems: 'center' }} >
            <Icon size={17} color={color||"grey"} />
        </Box>
        <div style={{ flex: 1 }}><Text size="sm">{label}</Text></div>
        {open!==undefined&&<IconChevronRight size={17} stroke={1.5} style={{transform: open ? `rotate(${90}deg)` : 'none',}} />}
        {Ricon&&<Ricon size={17} stroke={1.5}/>}
    </Group>
    </UnstyledButton>
    )
}

export default function TemplateExplorer() {
    const [ searchValue, setSearchValue ] = useState<string>('');
    const { close, opened, input } = useTemplater();
    const { template } = useTemplate();
    const files = useSelector(getFiles);
    const add = (value: string, quote = true) => {
        if (!input) return;
        input.focus();
        document.execCommand('insertText', false, quote ? `{{${value}}}` : value);
    }
    const tagCloud = useMemo(()=>flattenTemplate(template),[ template ]);
    return (
    <Drawer zIndex={300} position="right" size="lg" opened={opened} onClose={close} overlayProps={{ opacity: 0.2}} title={<Group><Text>Template Explorer</Text></Group>} >
        {JSON.stringify(template)}
        <TextInput
        pb="xs" leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        placeholder="Search" onChange={event=>setSearchValue(event.target.value)} value={searchValue}
        rightSection={ (searchValue) ? ( <CloseButton size="sm" onClick={() => setSearchValue("")} aria-label="Clear value" /> ) : undefined }
        />
        {searchValue&&
        <Flex style={{justifyContent: 'center'}} gap="sm" justify="flex-start" align="center" direction="row" wrap="wrap" >
        {tagCloud.map(item => (
            <Button onClick={()=>add(item)} variant="default" radius="xl" size="compact-xs" key={item}>{item}</Button>
        ))}
        </Flex>
        }
        {files.length>0&&<Section label="Files" Icon={IconFiles} onClick={()=>setSearchValue(`$file.`)} Ricon={IconSearch} />}
        </Drawer>
    )
}
