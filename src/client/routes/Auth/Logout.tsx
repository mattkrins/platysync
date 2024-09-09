import { Container, SimpleGrid, Center, Loader, Text } from '@mantine/core';
import React, { useEffect } from 'react'
import { useLocation } from 'wouter';
import useFetch from '../../hooks/useFetch';

export default function Logout() {
  const [_, setLocation] = useLocation();
  const { del } = useFetch<{ setup: number }>({
      url: "/auth",
      finally: () => setLocation(`/login`),
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
