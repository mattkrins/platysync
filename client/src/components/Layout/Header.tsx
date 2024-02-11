import { Group, Burger, Title, Code } from "@mantine/core";

export default function Header( { opened, toggle, version }: { opened?: boolean, toggle?(): void, version?: number } ) {
  return (
    <Group h={!toggle?undefined:"100%"} px={!toggle?undefined:"md"} justify="space-between" >
      {toggle&&<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />}
      <Title order={3}>CDAP Provisioner</Title>
      <Code fw={700}>v{version||0}</Code>
    </Group>
  )
}
