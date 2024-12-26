/**
 * Headers. Used throughout the application for consistency.
 */
import {PropsWithChildren} from 'react'

export interface HeaderProps {
    center?: boolean
    className?: string
}

export function PageHeader({children, center, className}: PropsWithChildren<HeaderProps>) {
    return <h1 className={`title ${className || ''} ${center ? 'has-text-centered' : ''}`}>{children}</h1>
}

export function SectionHeader({children, center, className}: PropsWithChildren<HeaderProps>) {
    return <h2 className={`subtitle mb-1 ${className || ''} ${center ? 'has-text-centered' : ''}`}>{children}</h2>
}

export function SectionSubHeader({children, center, className}: PropsWithChildren<HeaderProps>) {
    return <h3 className={`subtitle mb-1 ${className || ''} is-5 ${center ? 'has-text-centered' : ''}`}>{children}</h3>
}
