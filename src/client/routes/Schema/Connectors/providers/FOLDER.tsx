import { Select } from "@mantine/core";
import { IconFolder } from "@tabler/icons-react";
import ExtTextInput from "../../../../components/ExtTextInput";
import { providerConfig } from "../providers";

export default function FOLDER( { props }: providerConfig ) {
    return (
    <>
        <ExtTextInput
            label="Folder Path"
            placeholder="C:/folder/"
            leftSection={<IconFolder size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            withAsterisk {...props("path")}
        />
        <Select mt="xs" label="Iterate Over" withAsterisk
            {...props("type")}
            defaultValue="Files"
            data={[
                { label: 'Files', value: 'file' },
                { label: 'Directory', value: 'directory' },
                { label: 'Both', value: 'both' },
            ]}
        />
    </>);
}
