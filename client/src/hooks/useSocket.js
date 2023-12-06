import { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client';

const socketGlobal = io();

export default function useSocket( name, props = {} ) {
    const socketRef = useRef(socketGlobal);
    const [state, setState] = useState(props.default);
    useEffect(() => {
        const socket = socketRef.current;
        socket.on(name, (res, ...etc)=>{
            if (props.set !== false) setState(res);
            if (props.then) props.then(res, ...etc);
        });
        return () => {
            socket.off(name);
        };
    }, [name, props]);
    return [state, setState];
}
