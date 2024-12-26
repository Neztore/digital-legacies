import {SectionSubHeader} from '../../../shared/Headers.tsx'
import {CircleData} from './index.tsx'
import {InputWithButton} from '../../../shared/InputWithButton.tsx'
import {PropsWithChildren} from 'react'

export interface CircleProps {
    circle: CircleData
    setCircle: (circle: CircleData) => any
    deleteCircle: () => any,
    disabled?: boolean

}

/**
 * Render a circle in the share config page.
 * @param deleteCircle Function to delete a circle.
 * @param setCircle Function to update the information for this circle.
 * @param circle Circle data.
 * @param disabled Whether this circle is disabled (i.e. when updating)
 */
export function Circle({deleteCircle, setCircle, circle, disabled = false}: CircleProps) {
    const {required, name, key_comments} = circle
    const updateRequired = () => setCircle({...circle, required: !required})
    const removeKey = (ind: number) => {
        if (disabled) return;
        const newKeys = [...key_comments]
        newKeys.splice(ind, 1)
        setCircle({...circle, key_comments: newKeys})
    }

    const addBox = (
        <p><input
            type='checkbox' className='checkbox'
            checked={required}
            onChange={updateRequired}
            disabled={disabled}
        /> At least one of this circle is needed to unlock.
        </p>
    )

    return (
        <CircleDisplay
            className={required ? 'is-required' : ''} title={name} middle={`${key_comments.length} keys`}
            right={addBox} smallText="(Circle)"
        >
            <>
                {key_comments.map((s, i) => <div key={s} className='key'>
                    <p>Key {i + 1}:</p>
                    <p className='has-text-weight-bold'>  {s}</p>

                    <button className='delete is-small' disabled={disabled} onClick={() => removeKey(i)}/>
                </div>)}
                <br/>

                <label className='label'>Add a keyshare</label>
                <div className='level'>
                    <div className='level-left'>
                        <div className='level-item'>
                            <div>
                                <InputWithButton
                                    placeholder='Key comment'
                                    disabled={disabled}
                                    handleSubmit={k => setCircle({
                                        ...circle,
                                        key_comments: [...key_comments, k || 'No comment']
                                    })}
                                />
                            </div>

                        </div>
                    </div>

                    <div className='level-right'>
                        <div className='level-item'>
                            <button className='button is-danger' onClick={deleteCircle} disabled={disabled}>Delete
                                circle
                            </button>
                        </div>
                    </div>
                </div>
            </>
        </CircleDisplay>
    )
}

export interface CircleDisplayProps {
    title: string
    middle: string
    right: JSX.Element
    className?: string
    handleClick?: () => any,
    smallText?: string
}

/**
 * Circle display component. Also works as a big button - it is used when selecting vault type.
 * @param className Extra class names to add.
 * @param title Big text at the top, in the header
 * @param middle Text to put in the middle of the header
 * @param right Element to put in the right of the element. A checkbox for circle share configuration.
 * @param children Children - the keys.
 * @param handleClick Function handler to call when it is clicked.
 * @param smallText Small text to put beside the title.
 * @constructor
 */
export function CircleDisplay({
                                  className,
                                  title,
                                  middle,
                                  right,
                                  children,
                                  handleClick, smallText
                              }: PropsWithChildren<CircleDisplayProps>) {
    return (
        <div className={`circle ${className || ''} ${(handleClick != null) ? 'is-clickable' : ''}`}
             onClick={handleClick}>
            <div className='level circle-top'>
                <div className='level-left'>
                    <div className='level-item'>
                        <SectionSubHeader>{title}</SectionSubHeader> <span
                        className="is-small ml-3">{smallText || ""}</span>
                    </div>
                </div>
                <div className='level-item'>
                    <p>{middle}</p>
                </div>

                <div className='level-right'>
                    <div className='level-item'>
                        {right}
                    </div>
                </div>
            </div>
            <div className='circle-inside'>
                {children}
            </div>
        </div>
    )
}
