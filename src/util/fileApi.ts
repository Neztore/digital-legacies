// File APIs. Generally a wrapper around the Tauri APIs.
import {open, save} from '@tauri-apps/api/dialog'
import {
    BaseDirectory,
    copyFile,
    createDir,
    exists,
    FileEntry,
    readDir,
    removeDir,
    removeFile,
    writeTextFile
} from '@tauri-apps/api/fs'
import {documentDir, join} from '@tauri-apps/api/path'
import {getName} from '../pages/creation/import/FileBrowser/FileList.tsx'
import {invoke} from "@tauri-apps/api";

const BASE_DIR = BaseDirectory.AppData
const VAULT_DIR = 'vault'

type FilterPart = { name: string, extensions: string[] }
type Filter = FilterPart[]

export const VaultFilter: Filter = [{name: 'Digital vault', extensions: ['vault']}];
export const KeyFilter: Filter = [{name: 'Main key or keyshare', extensions: ['ks', "key"]}];

/**
 * Allows a file or folder to be selected, with an optional filter. Filters could be for keys, vaults or other.
 * @param isDirectory Boolean to select a folder.
 * @param filter Filter to use in the dialog box.
 */
export async function selectFile(isDirectory: boolean = false, filter: Filter = []): Promise<string[]> {
    const selected = await open({
        multiple: true,
        recursive: true,
        directory: isDirectory,
        title: `Select a ${isDirectory ? 'folder' : 'file'} to import`,
        filters: filter ? filter : []
    })
    if (!selected) return []
    if (Array.isArray(selected)) {
        return selected
    }
    return [selected]
}

/**
 * Saves a vault. Defaults to documents directory.
 * Saving a vault is actually... copying it out if the internal app folder.
 * @param vaultPath Current path of the vault (internal folder).
 */
export async function saveVault(vaultPath: string): Promise<boolean> {
    const docDir = await documentDir()
    const location = await save({
        title: 'Choose where you would like the data to be exported to',
        filters: VaultFilter,
        defaultPath: docDir + '/data.' + VaultFilter[0].extensions[0]
    })

    if (!location) return false
    // Copy vault to the location
    await copyFile(vaultPath, location)

    return true
}

/**
 * Get the path to save folder to from the Rust logic.
 */
export const cloudVaultDownloadLoc = (): Promise<string> => {
    return invoke("get_file_path");
}

/**
 * Save key to file.
 * @param key Key contents as a hex string.
 * @param name Key name to use as file name.
 * @param isMain Boolean indicating if main key. Dictates the file extension.
 */
export async function saveKey(key: string, name: string, isMain: boolean): Promise<boolean> {
    const docDir = await documentDir()
    const location = await save({
        title: 'Choose where you would like to save the key.',
        filters: KeyFilter,
        defaultPath: docDir + `/${name}.` + (isMain ? KeyFilter[0].extensions[1] : KeyFilter[0].extensions[0])
    })

    if (!location) return false
    // Copy vault to the location
    await writeTextFile(location, key)

    return true
}

/**
 * Creates a new vaultFolder and associated actual folder. VaultFolder factory.
 */
export async function createVaultFolder(): Promise<VaultFolder> {
    const folderName = (new Date()).getTime()
    const folderNameStr = `${folderName}`

    const path = await join(VAULT_DIR, folderNameStr)
    await createDir(path, {
        dir: BASE_DIR,
        recursive: true
    })

    return new VaultFolder(path)
}

/**
 * Open an existing vault folder - VaultFolder factory.
 * @param path
 */
export async function openVaultFolder(path: string): Promise<VaultFolder> {
    const folderExists = await exists(path, {
        dir: BASE_DIR
    })

    if (!folderExists) throw new Error(`Could not open vault: Folder ${path} does not exist.`)

    return new VaultFolder(path)
}

/**
 * Creates a temporary folder for storing vault contents, copies in and remove files
 */
export class VaultFolder {
    private readonly path: string

    constructor(root: string) {
        this.path = root
    }

    /**
     * Copy a file into the vault
     * @param innerPath Path components to use to reference w/i vault folder. Must end with the file name.
     * @param itemPath String representing the current path of the file.
     */
    async addFile(innerPath: string[], itemPath: string) {
        const newPath = await this.getFullPath(innerPath)
        await copyFile(itemPath, newPath, {
            dir: BASE_DIR
        })
    }

    /**
     * Remove a file. Should only be used on internal items, but uses the full path as it is available to the application
     * through the FileEntry interface, and it is more robust than relying on internal paths.
     * @param path String representing path to internal item.
     */
    async removeFile(path: string) {
        await removeFile(path, {
            dir: BASE_DIR
        })
    }

    /**
     * Retrieves all items in a given internal folder.
     * @param innerPath String[] representing path components
     */
    async getItems(innerPath: string[]): Promise<FileEntry[]> {
        const newPath = await this.getFullPath(innerPath)
        return await readDir(newPath, {
            dir: BASE_DIR
        })
    }

    /**
     * creates a new directory with the given internal path
     * @param innerPath
     */
    async addDir(innerPath: string[]) {
        const newPath = await this.getFullPath(innerPath)
        await createDir(newPath, {
            dir: BASE_DIR,
            recursive: true
        })
    }

    /**
     * Removes a directory with the given path. Removes all children.
     * @param path
     */
    async removeDir(path: string) {
        await removeDir(path, {
            dir: BASE_DIR,
            recursive: true
        })
    }

    /**
     * Copies in a directory with all of its children. Should not be used for big folders - very inefficient as it blocks on every copy.
     * @param innerPath
     * @param currentPath
     */
    async moveDir(innerPath: string[], currentPath: string) {
        // Create directory
        await this.addDir(innerPath)
        const items = await readDir(currentPath)
        return await this.copyChildren(items, innerPath)
    }

    /**
     * Returns the path for use by Rust.
     * Needs to add on the temp directory path.
     */
    getPath(): string {
        return this.path
    }

    /**
     * Get the full path from an internal path, relative to base directory
     * @param str Path components to join
     * @private
     */
    private async getFullPath(str: string[]): Promise<string> {
        return await join(this.path, ...str)
    }

    /**
     * Copies an array of children to a new parent folder.
     * @param items Children to copy.
     * @param path Path to new parent folder.
     * @private
     */
    private async copyChildren(items: FileEntry[], path: string[]) {
        for (const child of items) {
            const newPath = [...path, child.name || getName(child.path)]
            await this.addFile(newPath, child.path)
            if (Array.isArray(child.children)) {
                await this.copyChildren(child.children, newPath)
            }
        }
    }
}
