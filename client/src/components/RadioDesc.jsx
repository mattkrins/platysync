import React from 'react'
import { Radio, Icon } from 'semantic-ui-react'

export default function RadioDesc( { name, selector, selected, description, icon, color, ...props } ) {
    return (
        <div className='radio pt-1'>
            <Radio
            checked={props.toggle?selected:selected===name}
            onClick={props.disabled?undefined:()=>selector&&selector(name)}
            {...props} />
            {description&&
            <div className={`description ${props.toggle?'toggle':''}`} >{description} {
                icon&&
                <Icon name={icon} color={color}/>}
            </div>}
        </div>
    )
}
