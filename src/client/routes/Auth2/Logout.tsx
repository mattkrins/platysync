import { Container, SimpleGrid, Center, Loader, Text } from '@mantine/core';
import { useEffect } from 'react'
import { useLocation } from 'wouter';
import useAPI from '../../hooks/useAPI';
import { useDispatch } from '../../hooks/redux';
import { logout } from '../../providers/appSlice';

export default function Logout() {
  const [_, setLocation] = useLocation();
  const dispatch = useDispatch();
  const { del } = useAPI<{ setup: number }>({
      url: "/auth",
      finally: () => {
        dispatch(logout());
        setLocation(`/login`);
      },
  });
  useEffect(()=>{ del() }, []);
  return (
  <Container fluid mt="10%" >
      <SimpleGrid cols={1} mt="md">
      <Center><Loader size={20}/><Text ml="xs">Logging out...</Text></Center>
      </SimpleGrid>
  </Container>
  );
}
