import { useState } from 'react';
import { Box, Group, Modal as M, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Dropzone, DropzoneProps } from '@mantine/dropzone';
import '@mantine/dropzone/styles.css';
import { IconUpload, IconX, IconFileImport } from '@tabler/icons-react';

interface Modal {
  open(): void,
  close(): void,
  toggle(): void,
  reset(): void,
  opened?: boolean,
  Modal: React.FC<ModalProps>,
  dropped: File|undefined
}

interface ModalProps extends Omit<DropzoneProps, "onDrop"> {
  children?: React.ReactNode;
  title?: string;
  error?: string;
  description?: string;
  loading?: boolean;
  cleanup?: boolean;
  closeup?: boolean;
  root?: {[k: string]: unknown};
  onDrop?(file: File): void
}

export default function useImporter(title?: string, initalState = false): Modal {
  const [dropped, drop] = useState<File|undefined>(undefined);
  const [opened, { close, open, toggle }] = useDisclosure(initalState);
  const reset = () => drop(undefined);
  const Modal: React.FC<ModalProps> = ({ children, root, loading, error, description, cleanup, closeup, onDrop,  ...rest }: ModalProps) => (
    <M size="lg" opened={opened} onClose={close} title={rest.title?rest.title:title} withCloseButton={false} {...root||{}}>
      {children}
      <Dropzone loading={loading} {...rest||{}}
      onDrop={onDrop?(files: File[])=>{
        drop(files[0]);
        onDrop(files[0]);
        if (cleanup) reset();
        if (closeup) close();
      }:(files: File[])=>{
        drop(files[0]);
      }}
      >
          <Group justify="center" gap="xs" mih={200} style={{ pointerEvents: 'none' }}>
              <Dropzone.Accept><IconUpload size={50} stroke={1.5} /></Dropzone.Accept>
              <Dropzone.Reject><IconX size={50} stroke={1.5} /></Dropzone.Reject>
              <Dropzone.Idle><IconFileImport size={50} stroke={1} /></Dropzone.Idle>
              {children?
              <Box>
                {children}
                {error&&<Text c="red" inline mt={7}>{error}</Text>}
              </Box>:
              <Box>
                {dropped?<><Text size="xl" inline>Drop file here or click to select file</Text>
                <Text  size="sm" c="dimmed" mt={7} inline>{dropped.name}</Text></>:
                <Text size="xl" inline>Drop file here or click to select file</Text>}
                {description&&<Text size="sm" c="dimmed" inline mt={7}>{description}</Text>}
                {error&&<Text c="red" inline mt={7}>{error}</Text>}
              </Box>}
          </Group>
      </Dropzone>
    </M>
  );

  return ({
    Modal,
    opened,
    open,
    close,
    reset,
    toggle,
    dropped
  });

}