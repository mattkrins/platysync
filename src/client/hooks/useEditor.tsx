import { useState, SetStateAction, Dispatch } from "react";

type editor<type = object, editType = boolean> = [
    properties: type | undefined,
    editing: boolean,
    {
        editing: editType | undefined;
        setProperties: (value: SetStateAction<type | undefined>) => void;
        setEditing: Dispatch<SetStateAction<editType | undefined>>;
        add: (properties?: type) => void;
        close: () => void;
        edit: (properties: type, editing?: editType) => void;
    }
]

export default function useEditor<type = object, editType = boolean>(defaultProperties: type): editor<type, editType> {
    const [ editing, setEditing ] = useState<editType>();
    const [ properties, setProperties ] = useState<type>();
    const add = (properties?: type) => setProperties(properties||defaultProperties);
    const close = () => { setProperties(undefined); setEditing(undefined); };
    const edit = (properties: type, editing?: editType) => {
        setProperties(properties);
        setEditing(editing !== undefined ? editing : true as editType);
    };
    return [ properties, editing !== undefined, { editing:  editing, setProperties, setEditing, add, close, edit } ];
}
