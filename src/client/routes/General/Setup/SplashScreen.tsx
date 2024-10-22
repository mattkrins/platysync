import { Image, Container, Title, Button, Group, Text, List, ThemeIcon, rem, Anchor } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import classes from './Setup.module.css';
import { useLocation } from 'wouter';

export default function SplashScreen() {
  const [_, setLocation] = useLocation();
  return (
    <Container size="md">
      <div className={classes.inner}>
        <div className={classes.content}>
          <Title className={classes.title}>Welcome to PlatySync</Title>
          <Text c="dimmed" mt="md">
          Perform a set of actions for every user/row/entry in a data source. 
          Automate your on-prem active directory, among other things. 
          </Text>
          <List
            mt="md"
            spacing="sm"
            size="sm"
            icon={
              <ThemeIcon size={20} radius="xl">
                <IconCheck style={{ width: rem(12), height: rem(12) }} stroke={2} />
              </ThemeIcon>
            }>
            <List.Item>
              <b>Template System</b> – uses a powerful string templating language with a scoped usable data explorer.
            </List.Item>
            <List.Item>
              <b>Scheduling</b> – execute automation rules on a CRON schedule or by monitoring specific files.
            </List.Item>
            <List.Item>
              <b>Free and open source</b> – distributed with a <Anchor target='_link' href='https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en'>CC BY-NC-SA 4.0</Anchor> license.
            </List.Item>
          </List>
          <Text c="dimmed" mt="md">
          If you are seeing this page, PlatySync was successfully installed. To begin, we need to do some simple setup.
          </Text>
          <Group mt="lg">
            <Button onClick={() => setLocation('/setup/1')} radius="xl" size="md" className={classes.control}>
              Get started
            </Button>
            <Button variant="default" href='https://github.com/mattkrins/platysync' target='_blank' component='a' radius="xl" size="md" className={classes.control}>
              Source code
            </Button>
          </Group>
        </div>
        <Image src="/logo.png" className={classes.image} alt="Logo" />
      </div>
    </Container>
  );
}