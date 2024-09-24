import SplashScreen from "./SplashScreen";
import CreateUser from "./CreateUser";
import { Redirect, useParams } from "wouter";
import { useSelector } from "../../hooks/redux";
import { isSetup } from "../../providers/appSlice";
import CreateSchema from "./CreateSchema";

export default function Setup() {
    const params = useParams();
    const setup = useSelector(isSetup);
    if (setup) return <Redirect to="/" />
    switch (Number(params.step)) {
        case 1: return <CreateUser/>;
        case 2: return <CreateSchema/>;
        default: return <SplashScreen/>;
    }
}
