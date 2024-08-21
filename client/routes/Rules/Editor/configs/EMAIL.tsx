import { Grid, TextInput, SimpleGrid } from "@mantine/core";
import { IconWorld, IconUser, IconAt } from "@tabler/icons-react";
import SecurePasswordInput from "../../../../components/SecurePasswordInput";
import { actionConfigProps } from "../../../../modules/actions";

export default function TransEmailSendConfig({ form, configProps }: actionConfigProps) {
    return (
    <>
      <Grid>
        <Grid.Col span={9}>
          <TextInput
            label="Host"
            leftSection={<IconWorld size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            placeholder="smtp-mail.domain.com"
            withAsterisk
            {...configProps('host')}
          />
        </Grid.Col>
        <Grid.Col span={3}>
          <TextInput
            label="Port"
            leftSection={<>:</>}
            placeholder="25"
            {...configProps('port')}
          />
        </Grid.Col>
      </Grid>
      <SimpleGrid mt="sm" cols={{ base: 1, sm: 2 }} >
          <TextInput withAsterisk
            label="Username"
            placeholder="username"
            leftSection={<IconUser size={16} style={{ display: 'block', opacity: 0.5 }}/>}
            {...configProps('username')}
          />
          <SecurePasswordInput withAsterisk
            label="Password"
            placeholder="password"
            secure={!!form.values.password&&typeof form.values.password !== 'string'}
            unlock={()=>form.setFieldValue("password", "")}
            {...configProps('password', false, true, "**************")}
          />
      </SimpleGrid>
      <TextInput mt="xs"
        label="From"
        description="The email address of the sender."
        placeholder="jane@domain.com"
        leftSection={<IconAt size={16} style={{ display: 'block', opacity: 0.8 }}/>}
        {...configProps('from')}
      />
    </>
    )
  }