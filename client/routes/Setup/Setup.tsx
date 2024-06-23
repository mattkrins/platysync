import { Redirect, useParams } from 'wouter';
import CreateUser from './CreateUser';
import CreateSchema from './CreateSchema';
import SplashScreen from './SplashScreen';
import { useAppDispatch, useAppSelector } from '../../providers/hooks';
import { isSetup, loadApp } from '../../providers/appSlice';
import { useEffect } from 'react';

export default function Setup({}) {
  const params = useParams();
  const setup = useAppSelector(isSetup);
  const dispatch = useAppDispatch();
  useEffect(()=>{ dispatch(loadApp()); }, []);
  if (setup) return <Redirect to="/" />;
  switch (Number(params.step)) {
    case 1: return <CreateUser/>;
    case 2: return <CreateSchema/>;
    default: return <SplashScreen/>;
  }
}
