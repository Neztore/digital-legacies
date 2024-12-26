import {PageHeader, SectionHeader} from '../../shared/Headers.tsx'
import {UnlockPageProps} from './index.tsx'
import {useEffect, useRef, useState} from 'react'
import {invoke} from '@tauri-apps/api'
import {keyStringToByteArray} from '../../util'
import {AppError, castErr, ErrorDisplay} from '../../shared/Errors.tsx'
import {FooterButton} from '../../shared/Footer.tsx'
import {open} from "@tauri-apps/api/dialog";

// Decryption page. Works like the encryption page in that it is rendered and then does the work in a useEffect.
export function DecryptingPage({vaultInfo, goNext, setVaultInfo, goBack}: UnlockPageProps) {
    const [error, setError] = useState<AppError | undefined>()
    const called = useRef(false)

    async function callDecrypt() {
        if (called.current) return
        called.current = true

        if (!vaultInfo || (vaultInfo.keys == null) || (vaultInfo.vaultInfo == null)) {
            return console.error('Missing items')
        }
        // decode keys
        const rawKeys = vaultInfo.keys.map(i => keyStringToByteArray(i))
        const pathToSaveTo = await open({
            title: "Select a location to save the data to.",
            directory: true
        });
        try {

            const res = await invoke('unlock', {
                filePath: vaultInfo.vaultInfo?.path,
                keys: rawKeys,
                savePath: pathToSaveTo
            })

            setVaultInfo({finalPath: res as string})

            goNext()
        } catch (err) {
            setError(castErr(err))
        }
    }

    function back() {
        setError(undefined)
        called.current = false
        goBack()
    }

    useEffect(() => {
        callDecrypt().catch(console.error)
    }, [])

    return (
        <div className='hero is-fullheight'>
            <div className='hero-body'>
                <div>
                    <PageHeader>Decrypting data</PageHeader>
                    <SectionHeader>Combining keys and decrypting data please wait</SectionHeader>
                    <ErrorDisplay error={error}/>
                    {(error != null) ? <FooterButton handleClick={back}/> : ''}
                </div>

            </div>
        </div>
    )
}
