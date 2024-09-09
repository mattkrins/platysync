import { useState, useEffect } from 'react';
import io from 'socket.io-client';

export default function useSocket<socketState = unknown>( name: string, props: {
    default?: socketState;
    state?: boolean;
    then?: (...a: unknown[])=>void;
} = {} ): [state: socketState, setState: React.Dispatch<React.SetStateAction<socketState>>] {
    const [state, setState] = useState<socketState>(props.default as socketState);
    useEffect( () => {
            const socket = io();
            socket.connect();
            socket.on(name, (res: socketState, ...etc)=>{
                if (props.state !== false) setState(res);
                if (props.then) props.then(res, ...etc);
            });
            return () => {
                socket.off(name);
                socket.disconnect();
            }
    }, [] );
    return [state, setState];
}
