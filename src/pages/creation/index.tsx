import {FunctionComponent, JSX, useState} from 'react'
import {ProgressIndicator} from '../../shared/ProgressIndicator.tsx'
import {SelectTypePage} from './1selectType.tsx'
import {PersonalInfoPage} from './2personalInfo.tsx'
import {UpdatesPage} from './5updates.tsx'
import {ReviewPage} from './7review.tsx'
import {EncryptingPage} from './8encrypting.tsx'
import {MainkeyPage} from './9mainkey.tsx'
import {ShareKeysPage} from './10shareKeys.tsx'
import {VaultInfo, VaultType} from './VaultInfo.tsx'
import {ImportData} from './import'
import {SharesConfigPage} from './shares'
import {ConsentPage} from './consent.tsx'

const stages = ['Vault type', 'Personal information', 'Data import', 'Updates & notifications',
    'Configure shares', 'Review', 'Consent', 'Backup', 'Save main key', 'Share keys']
const stageComponents: Array<FunctionComponent<PageProps>> = [SelectTypePage, PersonalInfoPage, ImportData, UpdatesPage,
    SharesConfigPage, ReviewPage, ConsentPage, EncryptingPage, MainkeyPage, ShareKeysPage]

/**
 * Page props - These are the values passed to every single page.
 * This makes each page fairly uniform in how they operate - they all update the same data object.
 * goNext and goBack allow the user to navigate forwards and backwards, as well as back to the welcome screen.
 */
export interface PageProps {
    goNext: () => void
    goBack: (home?: boolean) => void
    vaultInfo: Partial<VaultInfo>
    setVaultInfo: (info: Partial<VaultInfo>) => void
}

export interface CreateProps {
    initialVault?: VaultInfo
}

const CLOUD_ONLY_PAGES = [3]

/**
 * Main page manager.
 * @param initialVault - Vault data to be used initially. This is provided when updating an existing vault.
 * @constructor
 */
export function CreateVault({initialVault}: CreateProps): JSX.Element {
    const [page, _setPage] = useState<number>(0)
    const [vaultInfo, _setVaultInfo] = useState<Partial<VaultInfo>>(initialVault || {})

    const isOffline = vaultInfo.vault_type === VaultType.Offline

    function setVaultInfo(partial: Partial<VaultInfo>) {
        _setVaultInfo({
            ...vaultInfo, ...partial
        })
    }

    /**
     * Set the page number. Validates that the page is within bounds. Negative page numbers will trigger a reload,
     * Returning the user to the welcome screen.
     * @param newPage Page number to move to.
     */
    function setPage(newPage: number): void {
        if (newPage >= 0 && newPage < stageComponents.length) {
            _setPage(newPage)
        } else if (newPage < 0) {
            window.location.reload()
        }
    }

    /**
     * Go to the next page. Skips pages that are cloud only (i.e. notifications) if this is an offline-only vault.
     */
    const goNext = () => {
        let nextPage = page + 1

        if (isOffline && CLOUD_ONLY_PAGES.includes(nextPage)) {
            nextPage++
        }
        setPage(nextPage)
    }

    /**
     * Go to the previous page. Skips pages as required (see nextPage).
     * @param home
     */
    const goBack = (home?: boolean) => {
        let nextPage = page - 1
        if (home) return setPage(-1);

        if (isOffline && CLOUD_ONLY_PAGES.includes(nextPage)) {
            nextPage--
        }
        setPage(nextPage)
    }

    // Render
    const CurrentPage = stageComponents[page]

    return (
        <div className='stack'>
            <div className='static'>
                <ProgressIndicator stages={stages} activeStage={page} disabled={isOffline ? CLOUD_ONLY_PAGES : []}/>
            </div>

            <div className='fill'>
                <CurrentPage goNext={goNext} goBack={goBack} vaultInfo={vaultInfo} setVaultInfo={setVaultInfo}/>
            </div>

        </div>
    )
}

//
