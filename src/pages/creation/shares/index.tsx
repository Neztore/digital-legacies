import {PageProps} from '../index.tsx'
import {PageWrapper} from '../../../shared'
import {ContinueButton, Footer, FooterButton} from '../../../shared/Footer.tsx'
import {PageHeader} from '../../../shared/Headers.tsx'
import {useState} from 'react'
import {Circle} from './Circle.tsx'
import {InputWithButton} from '../../../shared/InputWithButton.tsx'

/**
 * Represents a single circle configuration.
 * Keys is only filled when it is returned from the Rust backend, and then it will contain an array of byte arrays.
 */
export interface CircleData {
    key_comments: string[]
    name: string
    required: boolean
    keys?: number[][]
}

// Share configuration page.
export function SharesConfigPage({goNext, goBack, vaultInfo, setVaultInfo}: PageProps) {
    const [circles, setCircles] = useState<CircleData[]>(vaultInfo.share_config?.circles || [{
        name: 'Default',
        required: true,
        key_comments: []
    }])
    const [keysNeeded, _setKeysNeeded] = useState<number>(vaultInfo.share_config?.required || 3)
    const [addCircleError, setAddCircleError] = useState<string | undefined>()
    const alreadySet = !!vaultInfo.keys && !!vaultInfo.keys.main;

    /**
     * Update a circle
     * @param c CircleData Circle to update
     */
    function updateCircle(c: CircleData) {
        if (alreadySet) return;
        // Put it at the right place. Otherwise, the entries change order every render, which is very odd.
        const newCircles = [...circles]
        const index = circles.findIndex(i => i.name === c.name)
        newCircles[index] = c
        setCircles(newCircles)
    }

    /**
     * Add a new circle with a given name.
     * Validates that the name is not in use.
     * @param name String new circle name.
     */
    function addCircle(name: string) {
        if (alreadySet) return;
        if (!name.trim()) {
            setAddCircleError('You need to provide a name for the circle.')
            return
        }
        if (circles.filter(c => c.name === name).length === 0) {
            setCircles([...circles, {name, key_comments: [], required: false}])
            setAddCircleError('')
        } else setAddCircleError('Circle names must be unique.')
    }

    /**
     * Delete circle
     * @param c CircleData circle to delete.
     */
    const deleteCircle = (c: CircleData) => !alreadySet && setCircles(circles.filter(circle => circle.name != c.name))

    /**
     * Persist configuration if the user navigates off this page.
     */
    function onNavigate() {
        setVaultInfo({
            share_config: {
                circles,
                required: keysNeeded
            }
        })
    }

    const next = () => {
        onNavigate()
        goNext()
    }
    const prev = () => {
        onNavigate()
        goBack()
    }

    const setKeysNeeded = (k: number) => {
        if (alreadySet) return;
        if (k >= 0 && k < 255) _setKeysNeeded(k)
    }

    // Count stats for error handling
    let emptyCircles = 0
    let totalShares = 0
    let totalRequired = 0
    for (const circle of circles) {
        if (circle.required) {
            totalRequired++
        }
        totalShares += circle.key_comments.length
        if (circle.key_comments.length === 0) emptyCircles++
    }

    // Warning & error logic. Provides warning and errors to try and prevent bad configurations.
    let errorText = ''
    let warningText = ''
    let canContinue = true
    if (circles.length === 0) {
        canContinue = false
        errorText = "You need to add at least one circle. A circle represents a group of friends or contacts, like 'Family'."
    } else if (totalShares < keysNeeded) {
        canContinue = false
        errorText = 'The total number of keys must be more than the number needed to release your data. Add some more keys.'
    } else if (emptyCircles > 0) {
        canContinue = false
        errorText = `You have ${emptyCircles} empty circles. Remove them or add some keys to them.`
    } else if (totalRequired === 0 && circles.length > 1) {
        warningText = `You have added multiple circles, but not marked any as required. Recipients will need ${keysNeeded} keys from any circle to unlock your data.`
    }

    return (
        <PageWrapper>
            <PageHeader>Configure shares</PageHeader>
            <p>
                Access to your vault is managed by keys. You have a main key which gives you access to your data. <br/>
                Your recipients each get a key-share, and you can set how many of those keys are needed to unlock your
                data. <br/>
                This threshold is up to you - but it is best to balance preventing unauthorised access against the
                potential for some keys to be lost.

            </p>
            <p>
                Recipients can be split into <span className="special-text">circles</span>, and a circle is a group like
                "Friends", "Family", or "Colleagues".
                A circle can be set as required. <br/>
                That means that one or more of the keys in that circle are needed to unlock your data.
                For example you generate 5 shares - 2 for friends and 3 for family - and a family member is required to
                participate
                to unlock your data.
            </p>
            {alreadySet ?
                <p className="error-text">You cannot update your circles when editing an existing vault, as existing
                    keys cannot be revoked. Please create a new one and delete this one if needed.</p> : ""}

            <p className='error-text has-text-right'>{addCircleError}</p>

            <br/>
            <div className='level'>
                <div className='level-left'>
                    <div className='level-item'>
                        Release my data when
                    </div>
                    <div className='level-item'>

                        <input
                            className='input ' type='number' placeholder='3' value={keysNeeded}
                            onChange={e => setKeysNeeded(parseInt(e.target.value, 10))}
                            disabled={alreadySet}
                        />
                    </div>
                    <div className='level-item'>
                        keys are combined.
                    </div>

                </div>

                <div className='level-right'>
                    <div className='level-item'>
                        <InputWithButton
                            placeholder='Add circle'
                            handleSubmit={addCircle}
                            disabled={alreadySet}
                        />
                    </div>
                </div>
            </div>

            <div>
                {circles.map(c => <Circle
                    key={c.name} circle={c} setCircle={updateCircle}
                    deleteCircle={() => deleteCircle(c)}
                    disabled={alreadySet}
                />)}
            </div>

            <p className='error-text'>{errorText || ''}</p>
            <p className='warning-text'>{warningText || ''}</p>
            <Footer>
                <ContinueButton handleClick={next} disabled={!canContinue}/>
                <FooterButton handleClick={prev}/>

            </Footer>
        </PageWrapper>
    )
}
