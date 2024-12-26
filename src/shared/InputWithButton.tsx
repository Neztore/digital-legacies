import {useState} from 'react'

export interface InputWithButtonProps {
    placeholder: string
    handleSubmit: (s: string) => any
    buttonColor?: string
    buttonText?: string,
    disabled?: boolean
}

/**
 * Input box with a button attached.
 * @param placeholder Placeholder text.
 * @param handleSubmit Function to call when button is clicked.
 * @param buttonColor Colour of the button using bulma colours. 'info', 'success', 'error' etc.
 * @param buttonText Text of the submit button.
 * @param disabled Boolean to disable both the input and button.
 * @constructor
 */
export function InputWithButton({
                                    placeholder,
                                    handleSubmit,
                                    buttonColor = 'info',
                                    buttonText = 'Add',
                                    disabled = false
                                }: InputWithButtonProps) {
    const [value, setValue] = useState<string>('')

    function submit() {
        if (disabled) return false;
        handleSubmit(value)
        setValue('')
    }

    return (
        <div className='field has-addons'>
            <div className='control'>
                <input
                    className='input' type='text' placeholder={placeholder} value={value}
                    onChange={e => setValue(e.target.value)}
                    disabled={disabled}
                />
            </div>
            <div className='control'>
                <button className={`button is-${buttonColor}`} onClick={submit}>
                    {buttonText}
                </button>
            </div>
        </div>
    )
}
