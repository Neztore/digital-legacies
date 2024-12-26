import {JSX} from 'react'
import {Purpose} from '../App.tsx'
import {SelectVault} from './open/SelectVault.tsx'
import {PublicVaultInfo} from './unlock/Unlockinfo.tsx'

interface WelcomeProps {
    setPurpose: (i: Purpose) => void
    handleSelect: (info?: PublicVaultInfo) => any
}

export function Welcome({setPurpose, handleSelect}: WelcomeProps): JSX.Element {
    return (
        <div className='hero is-fullheight'>
            <div className='hero-body'>
                <div className='container'>
                    <h1 className='title'>Welcome</h1>
                    <h2 className='subtitle'>What would you like to do?</h2>

                    <div className='buttons'>
                        <button className='button' onClick={() => setPurpose(Purpose.create)}>Create a new vault
                        </button>
                        <SelectVault handleOpen={handleSelect}/>
                        <button className='button' onClick={() => setPurpose(Purpose.unlock)}>Someone shared data with
                            me. Unlock their vault.
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
