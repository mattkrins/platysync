import { Alert, Button, JsonInput, Modal, Textarea, rem } from '@mantine/core';
import { IconPackageImport, IconAlertCircle } from '@tabler/icons-react';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import { useState } from 'react';

interface Props extends Partial<DropzoneProps> {
    close(): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onImport: (data: any) => void;
    onError?: () => void;
    opened?: boolean;
    title?: string;
    filename?: string;
    contentType?: string;
    json?: boolean;
    [k: string]: unknown;
}

export default function Importer({ opened, close, onImport, onError, title, json, contentType, filename, ...props }: Props) {
    const [value, setValue] = useState<string>("");
    const [error, setError] = useState<string|undefined>(undefined);
    const onClick = () => {
        setError(undefined);
        if (!json) return onImport(value);
        try {
            const data = JSON.parse(value);
            return onImport(data);
        } catch (e) { setError(String(e)); if (onError) onError(); }
    }
    const onDrop = (files: File[]) => {
        const reader = new FileReader();
        reader.readAsText(files[0],'UTF-8');
        reader.onload = readerEvent => {
          const content = readerEvent.target?.result as string;
          setValue(content);
        }
    };
    return (
        <Modal opened={opened||false} onClose={close} size="lg" title={title||"Import"}>
            <Button onClick={onClick} mb="xs" size="xs" leftSection={<IconPackageImport style={{ width: rem(16) }} />} >Import</Button>
            {error&&<Alert mb="xs" icon={<IconAlertCircle size={32} />} color="red">{error}</Alert>}
            <Dropzone onDrop={onDrop} {...props} >
                {json?
                <JsonInput size="xs" variant="filled" autosize value={value} minRows={4} onChange={v=>setValue(v)} placeholder='Drop .json exports here.' />:
                <Textarea size="xs" variant="filled" autosize value={value} minRows={4} onChange={v=>setValue(v.target.value)} placeholder='Drop exported files here.'  />}
            </Dropzone>
        </Modal>
    );
}