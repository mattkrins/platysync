interface Hash {
    hex: string;
    iv: string;
    it: number;
}

interface Session {
    username: string;
    expires: string;
    sessionId: string;
}

/** Replace all properties with strings. */
type rString<T> = { [K in keyof T]: string; };

type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;