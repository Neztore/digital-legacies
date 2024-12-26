/**
 * Error handling functionality. Includes an error boundary to display unhandled errors and error display helpers.
 */

import React, {PropsWithChildren} from 'react'

interface ErrorBoundaryState {
    error?: string
}

/**
 * Handles uncaught errors and displays them.
 * This is a 'last line of defence' of sorts: The alternative is a complete crash (in the frontend)
 */
export class ErrorBoundary extends React.Component<PropsWithChildren, ErrorBoundaryState> {
    constructor(props: PropsWithChildren) {
        super(props)
        this.state = {}
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {error: error.message}
    }

    componentDidCatch(error: Error, info: any) {
        console.error(error)
        console.error(info)
    }

    render() {
        if (this.state.error) {
            return (
                <div className='notification is-danger'>
                    <h1 className='title'>Oops, something went wrong.</h1>
                    <p>{this.state.error}</p>
                </div>
            )
        }

        return this.props.children
    }
}

/**
 * Show error text (red text)
 */
export const ErrorText = ({children}: PropsWithChildren<{}>) => <p className='error-text'>{children}</p>

/**
 * Represents an AppError - an error passsed from the backend.
 */
export interface AppError {
    error_type: string
    message: string
}

/**
 * Take an unknown value and try to infer its type. This is used to take the rejection result from a Tauri invocation and transform it into an AppError.
 * In virtually all cases it will be an AppError but typed as an any.
 * @param e error value to inspect
 * @returns AppError representing the error that has occurred.
 */
export const castErr = (e: any): AppError => {
    if (typeof e === 'object') {
        if (e.message && e.error_type) {
            return e as AppError
        } else if (e instanceof Error) {
            console.error(e);
            return {
                error_type: e.name || 'exception',
                message: e.message
            }
        } else if (e.message && e.status) {
            return {
                error_type: `Cloud Error ${e.status}`,
                message: e.message
            }
        }
    } else if (typeof e === 'string') {
        return {
            error_type: 'unknown_string',
            message: e
        }
    } else if (e instanceof Error) {
        return {
            error_type: 'exception',
            message: e.message
        }
    }
    console.log(e)
    console.log(typeof e);
    return {
        error_type: 'unknown',
        message: 'Invalid error type'
    }
}

/**
 * Displays an error.
 */
export interface ErrorDisplayProps {
    error?: AppError
}

export const ErrorDisplay = ({error}: ErrorDisplayProps) => (error != null)
    ? <p className='error-text'>{error.error_type}: {error.message}</p>
    : ''
