import { Select, Checkbox, } from "@mantine/core";
import { IconFile, IconTypography } from "@tabler/icons-react";
import Concealer from "../../../components/Concealer";
import ExtTextInput from "../../../components/ExtTextInput";
import { providerConfig } from "../../../modules/providers";

export default function CSV( { props }: providerConfig ) {
    return (
    <>
        <ExtTextInput
            label="File Path"
            leftSection={<IconFile size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            withAsterisk {...props("path", { placeholder: "C:/folder/input.csv" })}
        />
        <Concealer>
            <Checkbox mt="xs" label="Does not contain headers" {...props("noHeaders", { type: "checkbox" })} />
            <Select mt="xs"
                label="Text Encoding"
                defaultValue="utf8"
                placeholder="Encoding"
                data={['utf8', 'utf16le', 'latin1', 'base64', 'base64url', 'hex']}
                leftSection={<IconTypography size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                {...props("encoding", { placeholder: "Encoding" })}
            />
        </Concealer>
    </>);
}
