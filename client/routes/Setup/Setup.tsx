import { Redirect, useLocation, useParams } from 'wouter';
import CreateUser from './CreateUser';
import CreateSchema from './CreateSchema';
import SplashScreen from './SplashScreen';
import { Container, Center, Loader, Alert } from '@mantine/core';
import useFetch from '../../hooks/useFetch';
import { IconInfoCircle } from '@tabler/icons-react';

export default function Setup({}) {
  const params = useParams();
  const [_, setLocation] = useLocation();
  const { data, loading, error } = useFetch<{ setup: number }>( {
      url: "/api/v1",
      fetch: true,
      then: ({ setup }) => setLocation(`/setup/${setup}`),
  } );
  if (loading) return <Container fluid mt="10%" ><Center><Loader size="xl" type="dots" /></Center></Container>;
  if (!data||error) return <Container mt="10%" ><Alert title="Error: App init failure" color="red" icon={<IconInfoCircle />} >{error||"Failed to init."}</Alert></Container>;
  switch (Number(params.step)) {
    case 1: return <CreateUser/>;
    case 2: return <CreateSchema/>;
    case 3: return <Redirect to="/" />;
    default: return <SplashScreen/>;
  }
}
