import { ActionIcon, Box, Button, CloseButton, Code, Collapse, Flex, Group, Text, TextInput, Title, Tooltip, UnstyledButton, useMantineTheme } from '@mantine/core'
import { useTemplater } from '../context/TemplateContext';
import { ForwardRefExoticComponent, RefAttributes, useMemo, useState } from 'react';
import { Icon, IconBook2, IconBraces, IconChevronRight, IconFiles, IconFolderCode, IconKey, IconLicense, IconListDetails, IconPlug, IconProps, IconSearch } from '@tabler/icons-react';
import classes from './TemplateExplorer.module.css';
import { useConnectors, useSelector } from '../hooks/redux';
import { getFiles, getsDictionary, getsSecrets } from '../providers/schemaSlice';
import { getDictionary, getSecrets } from '../providers/appSlice';
import { useDisclosure } from '@mantine/hooks';
import { genericHelpers, pathHelpers, ruleHelpers } from '../modules/handlebars';


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
    description?: string;
    color?: string;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    Ricon?: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
}

function Section({ onClick, open, label, color, Icon, Ricon, description }: SectionProps ) {
    return (
    <UnstyledButton onClick={onClick} className={classes.connector} p="xs" mt="xs" >
    <Group>
        <Box style={{ display: 'flex', alignItems: 'center' }} >
            <Icon size={17} color={color||"grey"} />
        </Box>
        <div style={{ flex: 1 }}><Text size="sm">{label}</Text></div>
        {description&&<div><Text size="xs" c="dimmed" truncate="end">{description}</Text></div>}
        {open!==undefined&&<IconChevronRight size={17} stroke={1.5} style={{transform: open ? `rotate(${90}deg)` : 'none',}} />}
        {Ricon&&<Ricon size={17} stroke={1.5}/>}
    </Group>
    </UnstyledButton>
    )
}

interface FSectionProps {
    label: string;
    path: string;
    search(v: string): void;
    Icon: ForwardRefExoticComponent<IconProps & RefAttributes<Icon>>;
    list: { key: string, value?: string, description?: string }[];
}

function FSection({ label, path, list, search, Icon }: FSectionProps) {
    const [ open, { toggle } ] = useDisclosure();
    return (<>
        <Section open={open} label={label} Icon={Icon} onClick={toggle} />
        <Collapse mt="xs" in={open}>
            {list.map(item=>
            <UnstyledButton onClick={()=>search(`$${path}.${item.key}`)} mb="xs" key={item.key} className={classes.connector} p="xs" pt={4} pb={4} >
                <Title size="h6" >{item.key}</Title>
                {item.description&&<Text size="xs" c="dimmed" >{item.description}</Text>}
                {item.value&&<Code>{item.value}</Code>}
            </UnstyledButton>)}
        </Collapse>
    </>)
}

export default function TemplateExplorer() {
    const theme = useMantineTheme();
    const [ searchValue, search ] = useState<string>('');
    const { input, rule, buildTemplate } = useTemplater();
    const [ exploreAll, { toggle: toggleAll } ] = useDisclosure();
    const [ viewHelpers, { toggle: toggleHelpers } ] = useDisclosure();
    const { proConnectors } = useConnectors();
    const files = useSelector(getFiles);
    const sdict = useSelector(getsDictionary);
    const ssec = useSelector(getsSecrets);
    const gdict = useSelector(getDictionary);
    const gsec = useSelector(getSecrets);
    const add = (value: string, quote = true) => {
        if (!input) return;
        input.focus();
        document.execCommand('insertText', false, quote ? `{{${value}}}` : value);
    }
    const flattenedTemplate = useMemo(()=>flattenTemplate(buildTemplate(rule)),[ buildTemplate, rule ]);
    const tags = useMemo(()=>flattenedTemplate.filter(item => item.toLowerCase().includes(searchValue.toLowerCase()) ),[ flattenedTemplate, searchValue ]);
    const sources = useMemo(()=> rule?.primary ? [ rule.primary, ...(rule?.sources || []).map(s=>s.foreignName as string) ] : [], [ rule ] );
    const ruleConnectors = useMemo(()=>proConnectors.filter(item => sources.includes(item.name) ),[ proConnectors, sources ]);

    return (
    <Box>
        <TextInput
        leftSection={<IconSearch size={16} style={{ display: 'block', opacity: 0.5 }}/>}
        placeholder="Search" onChange={event=>search(event.target.value)} value={searchValue}
        rightSection={searchValue?
        <CloseButton size="sm" onClick={() => search("")} aria-label="Clear value" /> :
        <Tooltip label="Browse" position="left" color="gray" withArrow >
        <ActionIcon variant={exploreAll?"filled":"subtle"} color="gray" size="sm" onClick={toggleAll} ><IconListDetails size={14} aria-label="Clear value" /></ActionIcon></Tooltip> }
        />
        {(searchValue||exploreAll)?
        <Flex style={{justifyContent: 'center'}} gap="sm" justify="flex-start" align="center" direction="row" wrap="wrap" mt="xs" >
        {tags.map(item => (<Button onClick={()=>add(item)} variant="default" radius="xl" size="compact-xs" key={item}>{item}</Button>))}
        </Flex>:
        <>
            {ruleConnectors.map(c=><Section label={c.name} description={c.pName} Icon={c.Icon} color={theme.colors[c.color||"grey"][6]} Ricon={IconPlug} onClick={()=>search(`${c.name}.`)} />)}
            {files.length>0&&<FSection label="Files" path="file" Icon={IconFiles} list={files.map(f=>({ key: f.key||f.name, description: f.path }))} search={search} />}
            <FSection label="Paths" path="path" Icon={IconFolderCode} list={pathHelpers.map(f=>({ ...f, value: f.example }))} search={search} />
            {sdict.length>0&&<FSection label="Schema Dictionary" path="sdict" Icon={IconBook2} list={sdict} search={search} />}
            {ssec.length>0&&<FSection label="Schema Secrets" path="ssec" Icon={IconKey} list={ssec.map(f=>({ key: f.key }))} search={search} />}
            {gdict.length>0&&<FSection label="Global Dictionary" path="gdict" Icon={IconBook2} list={gdict} search={search} />}
            {gsec.length>0&&<FSection label="Global Secrets" path="gsec" Icon={IconKey} list={gsec.map(f=>({ key: f.key }))} search={search} />}
            {rule&&<FSection label="Rule Helpers" path="rule" Icon={IconLicense} list={ruleHelpers.map(f=>({ ...f, value: f.example }))} search={search} />}
            <Section open={viewHelpers} label="Global Helpers" Icon={IconBraces} onClick={toggleHelpers} />
            <Collapse mt="xs" in={viewHelpers}>
                {genericHelpers.map(helper=>
                <UnstyledButton onClick={()=>add(helper.example.split(" > ")[0].replace(/[{}]/g, ''))} mb="xs" key={helper.key} className={classes.connector} p="xs" pt={0} pb={4} >
                    <Title size="h6" >{helper.key}</Title>
                    {helper.description&&<Text size="xs" c="dimmed" >{helper.description}</Text>}
                    {helper.example&&<Code>{helper.example}</Code>}
                </UnstyledButton>)}
            </Collapse>
        </>}
        </Box>
    )
}
