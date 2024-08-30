import { useState, SetStateAction, Dispatch } from "react";

type editor<type = object, editType = boolean> =  [
    properties: type|undefined,
    editing: editType|undefined,
    {
        setProperties: (value: SetStateAction<type|undefined>) => void;
        setEditing: Dispatch<SetStateAction<editType | undefined>>;
        add: (properties?: type) => void;
        close: () => void;
    }
]

export default function useEditor<type = object, editType = boolean>(defaultProperties: type): editor<type, editType> {
    const [ editing, setEditing ] = useState<editType>();
    const [ properties, setProperties ] = useState<type>();
    const close = () => { setProperties(undefined); setEditing(undefined); };
    const add = (properties?: type) => setProperties(properties||defaultProperties);
    return [ properties, editing, { setProperties, setEditing, add, close } ];
}
