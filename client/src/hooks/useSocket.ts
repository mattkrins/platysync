import { useState, useEffect } from 'react';
import io from 'socket.io-client';


interface props {
    default?: unknown;
    set?: boolean;
    then?: (...a: unknown[])=>void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useSocket( name: string, props: props = {} ): any {
    const [state, setState] = useState<unknown>(props.default);
    useEffect( () => {
            const url = new URL(window.location.href);
            const socket = io(`http://${url.hostname}:2327`);
            socket.connect();
            socket.on(name, (res: unknown, ...etc)=>{
                if (props.set !== false) setState(res);
                if (props.then) props.then(res, ...etc);
            });
            return () => {
                socket.off(name);
                socket.disconnect();
            }
    }, [] );
    return [state, setState];
}
