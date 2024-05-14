import { Box, TextInput, Textarea } from "@mantine/core";
import { IconMail, IconTextCaption } from "@tabler/icons-react";
import SelectConnector from "../../../Common/SelectConnector";

export default function EmailSend( { form, index, templateProps, actionType, templates }: ActionItem ) {
    return (
        <Box p="xs" pt={0} >
            <SelectConnector
                label="Sender" withAsterisk
                clearable type="email"
                leftSection={<IconMail size="1rem" />}
                {...form.getInputProps(`${actionType}.${index}.source`)}
            />
            <TextInput mt="xs"
                label="To" withAsterisk
                description="Comma separated list or an array of recipients email addresses that will appear on the To: field."
                placeholder="smith@domain.com"
                leftSection={<IconTextCaption size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                {...templateProps(form, `${actionType}.${index}.target`, templates)}
            />
            <TextInput mt="xs"
                label="Subject" withAsterisk
                description="The subject of the email."
                placeholder="RE: Subject"
                leftSection={<IconTextCaption size={16} style={{ display: 'block', opacity: 0.8 }}/>}
                {...templateProps(form, `${actionType}.${index}.subject`, templates)}
            />
            <Textarea mt="xs"
                label="Message / Body"
                description="Plaintext version of the message to send."
                placeholder="Plaintext body."
                {...templateProps(form, `${actionType}.${index}.text`, templates)}
            />
            <Textarea mt="xs"
                label="Message / Body (HTML)"
                description="HTML version of the message to send."
                placeholder="<p>HTML body.</p>"
                {...templateProps(form, `${actionType}.${index}.html`, templates)}
            />
        </Box>
        )
}
