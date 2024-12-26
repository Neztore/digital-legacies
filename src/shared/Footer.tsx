/**
 * The Footer contains the buttons at the bottom of the screen.
 * These are separate components to enforce consistency. In most cases the StandardFooter is used, unless the text of
 * buttons needs to be updated, or they need to be disabled.
 */
import {PropsWithChildren} from 'react'

export const Footer = ({children}: PropsWithChildren) => {
    return <div className='buttons' style={{marginTop: '2vh'}}>{children}</div>
}

export interface FooterButtonProps {
    handleClick: () => any
    text?: string
    disabled?: boolean
}

export const FooterButton = ({handleClick, text = 'Back', disabled = false}: FooterButtonProps) => {
    return <button disabled={disabled} className='button' onClick={() => handleClick()}>{text}</button>
}

export const ContinueButton = ({handleClick, text = 'Continue', disabled = false}: FooterButtonProps) => {
    return <button disabled={disabled} className='button is-success' onClick={handleClick}>{text}</button>
}

export interface StandardFooterProps {
    handleContinue: () => void
    handleBack: () => void
}

// Continue button is on the 'outer edge' as per UX guidelines
export const StandardFooter = ({handleContinue, handleBack}: StandardFooterProps) => {
    return (
        <Footer>
            <ContinueButton handleClick={handleContinue}/>
            <FooterButton handleClick={handleBack}/>

        </Footer>
    )
}
