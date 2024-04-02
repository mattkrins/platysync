import { Group, Burger, Title, Code, Avatar } from "@mantine/core";

export default function Header( { opened, toggle, version }: { opened?: boolean, toggle?(): void, version?: string } ) {
  return (
    <Group h={!toggle?undefined:"100%"} px={!toggle?undefined:"md"} justify="space-between" >
      {toggle&&<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />}
      <Group>
        <Avatar src={'/logo192.png'} />
        <Title order={3}>PlatySync</Title>
        {version&&<Code fw={700}>v{version||0}</Code>}
      </Group>
    </Group>
  )
}
