import {PublicVaultInfo} from '../unlock/Unlockinfo.tsx'
import {EnterKey} from '../../shared/EnterKey.tsx'
import {PageWrapper} from '../../shared'
import {PageHeader, SectionSubHeader} from '../../shared/Headers.tsx'
import {Footer, FooterButton} from '../../shared/Footer.tsx'
import {useState} from 'react'
import {AppError, castErr, ErrorDisplay} from '../../shared/Errors.tsx'
import {invoke} from '@tauri-apps/api'
import {keyStringToByteArray, MASTER_KEY_LENGTH} from '../../util'
import {VaultInfo} from '../creation/VaultInfo.tsx'
import {downloadVault} from "../../util/cloudApi.ts";

export interface OpenProps {
    toOpen?: PublicVaultInfo
    handleCancel: () => any
    handleUnlock: () => any
    handleOpened: (v: VaultInfo) => any
}

/**
 * Open vault page. Does not use a page wrapper. Relies heavily on the EnterKey component and displays the vault owner details if known.
 * @param toOpen Vault to open.
 * @param handleCancel Function to call if they cancel/click back.
 * @param handleUnlock Function to call to switch to unlock using key pieces
 * @param handleOpened Function to call with key.
 * @constructor
 */
export function Open({toOpen, handleCancel, handleUnlock, handleOpened}: OpenProps): JSX.Element {
    const [error, setError] = useState<AppError | undefined>()

    function handleKeyInput(key: string) {
        const keyBits = keyStringToByteArray(key);

        (async function () {
            let filePath: string = toOpen?.path || ""
            let key = keyBits;
            let token: number[] = []

            // Get info for cloud vault
            if (!toOpen) {
                if (keyBits.length <= MASTER_KEY_LENGTH) {
                    // It's not a cloud vault.
                    throw new Error("The key you provided belongs to an offline vault. To open an offline vault instead, go back and click 'open offline vault'.");
                }
                token = keyBits.slice(MASTER_KEY_LENGTH)

                filePath = await downloadVault(token);

            }

            // Cut any extra bits off - may be cloud backup token encoded
            key = keyBits.slice(0, MASTER_KEY_LENGTH);

            const vaultInfo = await invoke('open', {
                filePath,
                key
            })
            const info = vaultInfo as VaultInfo;
            const share_token = key.slice(0, 8)
            handleOpened({...info, cloud_creds: token ? {owner_token: token, share_token} : undefined})

        })().catch(e => setError(castErr(e)))


    }

    return (
        <PageWrapper>
            <PageHeader>Enter main key</PageHeader>
            <SectionSubHeader>Enter the main key you saved when creating your vault to open it.</SectionSubHeader>

            <p>{toOpen ? `Vault is owned by ${toOpen.name} ${toOpen.email_address}` : ""} To unlock a vault with key
                shares, <a
                    onClick={handleUnlock}
                >click here
                </a>.
            </p>
            <ErrorDisplay error={error}/>
            <br/>
            <div className='columns is-mobile'>
                <div className='column is-6'>
                    <EnterKey handleKey={handleKeyInput}/>
                </div>
            </div>

            <Footer>
                <FooterButton handleClick={handleCancel}/>
            </Footer>
        </PageWrapper>
    )
}
