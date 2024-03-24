import { CopyButton, ActionIcon, Tooltip, rem, CopyButtonProps } from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';

interface copyIcon extends Omit<CopyButtonProps, 'children'> {
  disabled?: boolean;
}

export default function CopyIcon( { value, timeout = 2000, disabled }: copyIcon ) {
  return (
    <CopyButton value={value} timeout={timeout}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
          <ActionIcon disabled={disabled} color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
            {copied ? (
              <IconCheck style={{ width: rem(16) }} />
            ) : (
              <IconCopy style={{ width: rem(16) }} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
}