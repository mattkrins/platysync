import { TextInput, SimpleGrid, NumberInput } from "@mantine/core";
import { IconClock, IconSchool, IconUser } from "@tabler/icons-react";
import Concealer from "../../../../components/Concealer";
import SecurePasswordInput from "../../../../components/SecurePasswordInput";
import { providerConfig } from "../providers";

export default function STMC( { props }: providerConfig ) {
    return (
    <>
        <SimpleGrid mt="sm" cols={{ base: 1, sm: 2 }} >
            <TextInput withAsterisk
                label="Username"
                leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                placeholder="ST01235"
                {...props("username")}
            />
            <SecurePasswordInput withAsterisk
                label="Password"
                placeholder="User Password"
                {...props("password", { type: "password" })}
            />
        </SimpleGrid>
        <TextInput mt="sm"
            label="School Identification Number"
            leftSection={<IconSchool size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="1234"
            withAsterisk {...props("school")}
        />
        {
        //<SelectConnector mt="sm"
        //    {...props("eduhub", { placeholder: "" })} ids={["csv"]} clearable
        //    label="Match Eduhub" description="Match against eduhub making the _stkey header available."
        ///>
        }
        <Concealer>
            <NumberInput mt="sm"
                label="Caching Policy"
                description="Minutes to wait before invalidating downloaded cache."
                leftSection={<IconClock size={16} style={{ display: 'block', opacity: 0.5 }}/>}
                min={1}
                placeholder="1440 (1 day)"
                {...props("cache")}
            />
        </Concealer>
    </>);
}


export function STMCContext() {
    return <></>
}