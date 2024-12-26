import {PropsWithChildren} from 'react'

export interface DropdownButtonProps {
    text: String
}

export function DropdownButton({text, children}: PropsWithChildren<DropdownButtonProps>) {
    return (
        <div className='dropdown is-hoverable'>
            <div className='dropdown-trigger'>
                <button className='button' aria-haspopup='true' aria-controls='dropdown-menu'>
                    <span>{text}</span>
                </button>
            </div>
            <div className='dropdown-menu' id='dropdown-menu' role='menu'>
                <div className='dropdown-content'>
                    {children}
                </div>
            </div>
        </div>
    )
}

export interface DropdownItemProps {
    text: String
    handleClick: () => void
    isActive?: boolean
}

export function DropdownItem({text, handleClick, isActive}: DropdownItemProps) {
    return (
        <a href='#' className={`dropdown-item ${isActive ? 'is-active' : ''}`} onClick={handleClick}>
            {text}
        </a>
    )
}

export const DropdownDivider = () => <hr className='dropdown-divider'/>
