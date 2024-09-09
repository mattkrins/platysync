import { Redirect, useParams } from 'wouter';
import CreateUser from './CreateUser';
import CreateSchema from './CreateSchema';
import SplashScreen from './SplashScreen';
import { useDispatch, useSelector } from '../../hooks/redux';
import { isSetup, loadApp } from '../../providers/appSlice';
import { useEffect } from 'react';

export default function Setup({}) {
  const params = useParams();
  const setup = useSelector(isSetup);
  const dispatch = useDispatch();
  useEffect(()=>{ dispatch(loadApp()); }, []);
  if (setup) return <Redirect to="/" />;
  switch (Number(params.step)) {
    case 1: return <CreateUser/>;
    case 2: return <CreateSchema/>;
    default: return <SplashScreen/>;
  }
}
