import {ShareConfig, VaultType} from '../creation/VaultInfo.tsx'

// Basic data types.
export interface UnlockInfo {
    filePath: string
    vault_type: VaultType
    vaultInfo?: PublicVaultInfo
    keys?: string[]
    finalPath?: string
}

export interface PublicVaultInfo {
    share_config: ShareConfig
    name: string
    email_address: string
    nonce: number[]
    path: string
}
