import { Menu, Badge, Loader, Group, Tooltip } from "@mantine/core";
import { IconChevronDown, IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { useDispatch, useLoader, useSelector } from "../hooks/redux";
import { compareVersion } from "../modules/common";
import { getLatestVersion, checkVersion, getVersion } from "../providers/appSlice";

export default function VersionBadge() {
    const dispatch = useDispatch();
    const version = useSelector(getVersion);
    const latestVersion = useSelector(getLatestVersion);
    const { loadingVersion } = useLoader();
    const upgrade = (latestVersion && version && compareVersion(latestVersion, version) > 0);
    const color = upgrade ? "red" : "lime.4";
    return (
      <Menu shadow="md" width={160}>
        <Menu.Target><Tooltip disabled={!upgrade} color="gray" withArrow position="left" label={`New version ${latestVersion} available.`} >
          <Badge style={{cursor:"pointer"}} variant="dot" color={color} tt="lowercase">
            {loadingVersion?<Loader type="bars" color="orange" size={14} />:<Group gap={6} >v0.6.0 <IconChevronDown size={10} /></Group>}
          </Badge></Tooltip>
        </Menu.Target>
        <Menu.Dropdown>
          {loadingVersion&&<Menu.Label ta="center" >Checking version...</Menu.Label>}
          {upgrade&&<Menu.Label ta="center" c="red" >Version {latestVersion} available</Menu.Label>}
          {upgrade&&<Menu.Item fz="xs"
          leftSection={<IconExternalLink size={12} />}
          component="a"
          href="https://github.com/mattkrins/platysync/releases"
          target="_blank"
          >Upgrade now</Menu.Item>}
          <Menu.Item fz="xs" disabled={loadingVersion} leftSection={<IconRefresh size={12} />} onClick={()=>dispatch(checkVersion())} >Check for updates</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    )
}
