import {invoke} from '@tauri-apps/api'
import {PublicVaultInfo, UnlockInfo} from './Unlockinfo.tsx'
import {OpenButton} from '../../shared/OpenButton.tsx'
import {VaultType} from "../creation/VaultInfo.tsx";

export interface OpenOfflineProps {
    setVaultInfo: (i: Partial<UnlockInfo>) => any,
    goNext: () => any,
    text: string
}

export function OpenOffline({setVaultInfo, goNext, text}: OpenOfflineProps) {
    function handleAdd(s: string[]) {
        if (s.length === 0 || !s[0]) return;
        setVaultInfo({filePath: s[0]})
        invoke('load_meta', {
            filePath: s[0]
        })
            .then((d) => {
                const vaultInfo = d as PublicVaultInfo
                vaultInfo.path = s[0];

                setVaultInfo({vaultInfo, vault_type: VaultType.Offline})
                goNext()
            })
            .catch(console.error)
    }

    function handleErr(e: any) {
        throw e
    }

    return (
        <OpenButton handleAdd={handleAdd} handleError={handleErr} text={text} isVault={true}/>
    )
}
