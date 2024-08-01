import { ActionIcon, Group, JsonInput, Modal, Textarea, Tooltip, rem } from "@mantine/core";
import { IconDownload } from "@tabler/icons-react";
import CopyButton from "./CopyButton";

function download(data: string, filename: string, type: string = 'text/plain') {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface Props {
  close(): void;
  data?: string;
  title?: string;
  filename?: string;
  contentType?: string;
  json?: boolean;
  [k: string]: unknown;
}

export default function Exporter( { data, close, title, json, contentType, filename, ...props }: Props ) {
  const downloadData = () => download(data||"", filename ? filename : "export.txt", json ? "application/json": contentType );
  return (
    <Modal opened={!!data} onClose={close} title={title||"Export"}>
        <Group mb="xs" justify="space-between">
          <CopyButton value={data||""} />
          <Tooltip label="Download" withArrow position="right">
            <ActionIcon onClick={downloadData} variant="subtle" color="gray"><IconDownload style={{ width: rem(16) }}/></ActionIcon>
          </Tooltip>
        </Group>
        {json?<JsonInput size="xs" variant="filled" readOnly autosize value={data} {...props} />:<Textarea size="xs" variant="filled" readOnly autosize value={data} {...props} />}
    </Modal>
    );
}
