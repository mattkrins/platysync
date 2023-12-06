import React from 'react'
import { Form } from 'semantic-ui-react'

export default function SimpleField( {field, input, children, ...props} ) {
    const error =
    props.value === "" ? false :
    props.error ? props.error : 
    props.validator ? props.validator(props.value||"") : 
    false;
    return (
            <Form.Field className='mb-0 mt-2' {...field} error={!!error}  >
                <Form.Input
                    label={props.label}
                    required={props.required||false}
                    error={error}
                    icon={!!props.icon} iconPosition={props.icon&&'left'} placeholder={props.placeholder}
                    disabled={props.disabled}
                    loading={props.loading}
                    value={props.value||""}
                    onChange={props.onChange}
                    onBlur={props.onBlur}
                    {...input}
                >{children}</Form.Input>
            </Form.Field>
    )
}
