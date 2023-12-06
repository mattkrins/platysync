import { PropsWithChildren } from 'react';
import { Modal as M } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

interface Modal {
  open(): void,
  close(): void,
  opened?: boolean,
  Modal: React.FC<PropsWithChildren>,
}

export default function useModal(title?: string): Modal {
  const [opened, { close, open }] = useDisclosure(false);
  const Modal: React.FC<PropsWithChildren> = ({ children, ...rest }) => (
    <M size="lg" opened={opened} onClose={close} title={title} {...rest}>
      {children}
    </M>
  );

  return ({
    Modal,
    opened,
    open,
    close,
  });

}