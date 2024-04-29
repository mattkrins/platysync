import { Group, Burger, Title, Code, Avatar, Loader, Tooltip, ActionIcon } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import axios from 'axios';
import { IconAlertCircle } from "@tabler/icons-react";
import AppContext from "../../providers/AppContext";

export default function Header( { opened, toggle }: { opened?: boolean, toggle?(): void } ) {
  const [upgradeAvailable, setAvailable] = useState<string|undefined>(undefined);
  const { version, changeNav } = useContext(AppContext);

  const check = () => {
      const axiosClient = axios.create({headers: {'X-GitHub-Api-Version': '2022-11-28'}});
      axiosClient.get("https://api.github.com/repos/mattkrins/platysync/releases")
      .catch(error=>{ console.error('Failed to get latest version', error); })
      .then((( response )=>{
          if (!response) return;
          const { data: releases } = response as { data: {name: string}[] };
          const { name: latest } = releases[0];
          if (latest !== version) setAvailable(latest);
      }));
  }
  useEffect(()=>{ if (version) check(); }, [ version ]);

  return (
    <Group h={!toggle?undefined:"100%"} px={!toggle?undefined:"md"} justify="space-between" >
      {toggle&&<Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />}
      <Group>
        <Avatar src={'/logo192.png'} />
        <Title order={3}>PlatySync</Title>
        <Group gap="xs" >
          {!version?<Loader size="xs" type="dots" />:<Code fw={700}>v{version||0}</Code>}
          {upgradeAvailable&&<Tooltip position="right" label={`New release v${upgradeAvailable} available.`}>
            <ActionIcon onClick={()=>changeNav("Settings")} variant="subtle" color="orange" radius="xl">
              <IconAlertCircle size={22} color="orange" />
            </ActionIcon>
          </Tooltip>}
        </Group>
      </Group>
    </Group>
  )
}
