import { useState } from 'react'

import useFetch from './useFetch'

export default function useValidator() {
    const [ validating, setValidating ] = useState({});
    const { data: valid, fetch: validate, invalid } = useFetch({
        method: "post", default: {},
        before: (options) => { setValidating({[options.name||options.url]: true}); },
        finally: (options) => { setValidating(old=>({...old, [options.name||options.url]: false  })); }
    });
    return { validate, valid, invalid, validating };
}
