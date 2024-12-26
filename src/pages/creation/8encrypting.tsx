import {AppError, castErr, ErrorDisplay} from '../../shared/Errors.tsx'
import {PageHeader, SectionHeader} from '../../shared/Headers.tsx'
import {PageProps} from './index.tsx'
import {createVault, VaultInfo, VaultType} from './VaultInfo.tsx'
import {useEffect, useRef, useState} from 'react'
import {ContinueButton, FooterButton} from '../../shared/Footer.tsx'
import {ProgressIndicator} from "../../shared/ProgressIndicator.tsx";
import {saveVault} from "../../util/fileApi.ts";
import {uploadVault} from "../../util/cloudApi.ts";


const STAGES = ["Encrypting data", "Uploading", "Save"];

// The encrypting page performs encryption (unsurprisingly).
// It is rendered, then in a useEffect performs the actual encryption.
// Once encryption is finished buttons will be enabled to allow an offline copy to be saved or for the user to progress.
// The user can only move back from this page if an error occurs.
export function EncryptingPage({vaultInfo, setVaultInfo, goNext, goBack}: PageProps) {
    const [error, setError] = useState<AppError>()
    const called = useRef(false)
    const [stage, setStage] = useState<number>(0);
    const [saved, setSaved] = useState<boolean>(false);


    async function handleMake() {
        if (called.current) return
        called.current = true
        try {
            let {cloud_creds, output} = vaultInfo;

            // Do encrypt if not done already
            if (!output) {
                if (vaultInfo && vaultInfo.vault_type === VaultType.Offline) {
                    vaultInfo.alert_duration = 0
                    vaultInfo.reminder_period = 0
                }


                const {keys, path: ret_path, cloud_keys: ret_cloud} = await createVault(vaultInfo as VaultInfo)
                setVaultInfo({keys, cloud_creds: ret_cloud || cloud_creds, output: ret_path})

                // Update values in scope
                output = ret_path;
                cloud_creds = ret_cloud || cloud_creds;
            }

            // Do upload
            if (vaultInfo.vault_type === VaultType.Cloud) {
                if (!cloud_creds) {
                    return setError({
                        error_type: "Fail",
                        message: "Cloud vault expected cloud keys but did not receive any. Try again."
                    })
                } else if (!vaultInfo.personal_info || !vaultInfo.personal_info.name || !vaultInfo.personal_info.email_address) {
                    return setError({
                        error_type: "Fail", message: "Vault personal info was not set."
                    })
                } else {
                    // Uploading
                    setStage(1);
                    uploadVault(output, cloud_creds, vaultInfo.reminder_period || 0, vaultInfo.alert_duration || 0, vaultInfo.personal_info.name, vaultInfo.personal_info.email_address)
                        .then(() => setStage(2)).catch(e => setError(castErr(e)));
                }
            } else {
                // Save
                setStage(2)
            }

        } catch (err) {
            setError(castErr(err))
        }
    }

    // goBack w/ clearing errors.
    function back() {
        setError(undefined)
        called.current = false
        goBack()
    }

    /**
     * Save fault to file.
     */
    function save() {
        if (vaultInfo.output) {
            saveVault(vaultInfo.output).catch(e => setError(castErr(e)));
            setSaved(true);
        }
    }

    /**
     * Do the encryption.
     */
    useEffect(() => {
        handleMake().catch(console.error)
    }, [])

    // Rendering and text.
    const headerText = stage === 0 ? "Encrypting data and generating keys. Please wait..."
        : stage === 1 ? "Uploading vault to cloud. Please wait..." : vaultInfo.vault_type === VaultType.Cloud ? "Vault uploaded. You can download an offline copy, or just move onto keys." : "Vault generated. Download a copy before saving your keys."

    return (
        <div className='hero is-fullheight'>
            <div className='hero-body'>
                <div>
                    <PageHeader>Encrypting data</PageHeader>
                    <SectionHeader>{headerText}</SectionHeader>
                    <ProgressIndicator stages={STAGES} activeStage={stage}
                                       disabled={vaultInfo.vault_type === VaultType.Cloud ? [] : [1]}/>
                    <ErrorDisplay error={error}/>
                    <div className="buttons mt-3">
                        {/*  Button only works if it is in save stage, it's been saved (if offline) and there is no error. */}
                        <ContinueButton handleClick={goNext}
                                        disabled={stage != 2 || error != null || (vaultInfo.vault_type === VaultType.Offline && !saved)}/>
                        <button className="button" disabled={!vaultInfo.output} onClick={save}>Save offline copy
                        </button>
                        {(error != null) ? <FooterButton handleClick={back}/> : ''}
                    </div>

                </div>

            </div>
        </div>
    )
}
