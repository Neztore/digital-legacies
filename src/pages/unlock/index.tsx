import {FunctionComponent, useState} from 'react'
import {ProgressIndicator} from '../../shared/ProgressIndicator.tsx'
import {ChooseType} from './1chooseType.tsx'
import {UnlockInfo} from './Unlockinfo.tsx'
import {EnterKeys} from './3enterkeys.tsx'
import {VaultType} from '../creation/VaultInfo.tsx'
import {DecryptingPage} from './decrypting.tsx'
import {AccessPage} from './5access.tsx'
import {Initiate} from "./initiate.tsx";

const stages: string[] = ['Select type', 'Enter key pieces', 'Initiate & Notify', 'Decrypt', 'Access']
const stageComponents: Array<FunctionComponent<UnlockPageProps>> = [ChooseType, EnterKeys, Initiate, DecryptingPage, AccessPage]

// Special lists - used to disable pages when in the 'other' mode/type.
const CLOUD_ONLY = [2]

export interface UnlockPageProps {
    goNext: () => void
    goBack: () => void
    vaultInfo: Partial<UnlockInfo>
    setVaultInfo: (info: Partial<UnlockInfo>) => void
}

export function UnlockVault(): JSX.Element {
    const [page, _setPage] = useState<number>(0)
    const [vaultInfo, _setVaultInfo] = useState<Partial<UnlockInfo>>({})

    const isOffline = vaultInfo.vault_type == VaultType.Offline
    const DISABLED_PAGES = isOffline ? CLOUD_ONLY : []

    function setPage(newPage: number): void {
        if (newPage >= 0 && newPage < stages.length) {
            _setPage(newPage)
        } else if (newPage < 0) {
            window.location.reload()
        }
    }

    const goNext = () => {
        let nextPage = page + 1

        if (DISABLED_PAGES.includes(nextPage)) {
            nextPage++
        }
        setPage(nextPage)
    }

    const goBack = () => {
        let nextPage = page - 1

        if (DISABLED_PAGES.includes(nextPage)) {
            nextPage--
        }
        setPage(nextPage)
    }

    function setVaultInfo(partial: Partial<UnlockInfo>) {
        _setVaultInfo({
            ...vaultInfo, ...partial
        })
    }

    const CurrentPage = stageComponents[page]

    return (
        <>
            <ProgressIndicator stages={stages} activeStage={page} disabled={DISABLED_PAGES}/>

            <div>
                <CurrentPage
                    goNext={goNext} goBack={goBack} vaultInfo={vaultInfo}
                    setVaultInfo={setVaultInfo}
                />

            </div>

        </>
    )
}
