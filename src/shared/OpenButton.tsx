import {selectFile, VaultFilter} from '../util/fileApi.ts'

export interface OpenFileButtonProps {
    handleAdd: (paths: string[]) => void
    handleError: (error: string) => void
    isFolder?: boolean
    isVault?: boolean
    text?: string
}

/**
 * Open file button.
 * @param handleAdd Function to call with the selected paths.
 * @param handleError Function to call with an error string, if one occurs.
 * @param isFolder Whether the file window should show folders or files.
 * @param text button text. Optional.
 * @param isVault Whether it is opening a vault. Sets the vault file filer. if this is true, isFolder must be false.
 * @constructor
 */
export function OpenButton({handleAdd, handleError, isFolder = false, text, isVault}: OpenFileButtonProps) {
    async function openFile() {
        try {
            const files = await selectFile(isFolder, isVault ? VaultFilter : [])
            if (files) {
                handleAdd(files)
            }
        } catch (err) {
            if (err instanceof Error) {
                handleError(err.message)
            } else if (typeof err === 'string') {
                handleError(err)
            } else {
                throw err
            }
        }
    }

    const buttonText = text || `Open ${isFolder ? 'folder' : 'file'}`
    return <button className='button' onClick={openFile}>{buttonText}</button>
}
