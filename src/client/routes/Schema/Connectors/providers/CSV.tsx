import { Select, Checkbox, } from "@mantine/core";
import { IconFile, IconTypography } from "@tabler/icons-react";
import Concealer from "../../../../components/Concealer";
import ExtTextInput from "../../../../components/ExtTextInput";
import { providerConfig } from "../providers";

export default function CSV( { props }: providerConfig ) {
    return (
    <>
        <ExtTextInput
            label="File Path"
            leftSection={<IconFile size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="C:/folder/input.csv"
            withAsterisk {...props("path")}
        />
        <Concealer>
            <Checkbox mt="xs" label="Does not contain headers" {...props("noHeaders", { type: "checkbox" })} />
            <Select mt="xs"
                label="Text Encoding"
                defaultValue="utf8"
                data={['utf8', 'utf16le', 'latin1', 'base64', 'base64url', 'hex']}
                leftSection={<IconTypography size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="Encoding"
                {...props("encoding")}
            />
        </Concealer>
    </>);
}
