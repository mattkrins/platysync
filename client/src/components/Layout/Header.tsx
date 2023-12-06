import { Group, Burger, Title, Code } from "@mantine/core";

export default function Header( { opened, toggle }: { opened?: boolean, toggle?(): void } ) {
  return (
    <Group h={!toggle?undefined:"100%"} px={!toggle?undefined:"md"} justify="space-between" >
      {toggle&&<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />}
      <Title order={3}>CDAP Provisioner</Title>
      <Code fw={700}>v0.4.0</Code>
    </Group>
  )
}
