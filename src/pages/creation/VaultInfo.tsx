// Vault typings - Typescript version. vault.rs contains Rust typings.
// The interfaces and enums here use the casing conventions from Rust, as Rust is a lot stricter with these.
import {EMAIL_REGEX, NAME_MAX, NAME_MIN, ValidationError} from '../../util/constants.ts'
import {invoke} from '@tauri-apps/api'
import {CircleData} from './shares'

export enum VaultType {
    Offline = 'Offline',
    Cloud = 'Cloud'
}

export interface PersonalInfo {
    name?: string
    email_address?: string
    full_legal_name?: string
    phone_number?: string
    guidance_doc?: string
    address?: string
}

export interface KeyCollection {
    share_keys: CircleData[]
    main: number[]
}

export interface ShareConfig {
    required: number
    circles: CircleData[]
}

export interface VaultInfo {
    // Whether the vault is cloud-backed.
    alert_duration: number
    // Personal information which is added to the vault (within) before encryption
    keys?: KeyCollection,
    cloud_creds?: CloudKeyData
    // Time, in seconds, from key pieces being combined to release. Can be released earlier, or cancelled.
    // If this feature is disabled (or not supported) this value will be 0.
    personal_info: PersonalInfo
    // Months in-between each alert
    // This is intentionally less granular than the alertDuration to make the feature easier to implement.
    reminder_period: number
    share_config: ShareConfig
    vault_folder: string
    vault_type: VaultType,
    output?: string
}

export interface CloudKeyData {
    owner_token: number[]
    share_token: number[]
}

/**
 * Validates a name. Returns the validated string if successful, otherwise throws an error.
 * @param name Name to validate.
 */
export function validateName(name: string): string {
    if (!name || !name.trim()) {
        throw new ValidationError('Your name is required.')
    }
    const trimmed = name.trim()
    if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
        throw new ValidationError(`Your name must be between ${NAME_MIN} and ${NAME_MAX} characters.`)
    }

    return trimmed
}

/**
 * Validates an email. Throws an error if the email is invalid, otherwise a cleaned email is returned.
 * @param email String containing email address.
 */
export function validateEmail(email: string): string {
    const valid = EMAIL_REGEX.test(email)
    if (valid) return email.toLowerCase()
    throw new ValidationError('Invalid email address')
}


export interface CreateVaultResult {
    path: string
    keys: KeyCollection,
    cloud_keys?: CloudKeyData
}

export async function createVault(vault: VaultInfo): Promise<CreateVaultResult> {
    return await invoke('create', {vault})
}
