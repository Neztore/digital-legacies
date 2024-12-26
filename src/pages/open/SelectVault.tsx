import {invoke} from '@tauri-apps/api'
import {PublicVaultInfo} from '../unlock/Unlockinfo.tsx'
import {selectFile, VaultFilter} from "../../util/fileApi.ts";

export interface SelectVaultProps {
    handleOpen: (info?: PublicVaultInfo) => any
}

/**
 * Select vault button. Lets the user chose between w/ cloud and offline.
 * @param handleOpen Function to call with the basic vault info.
 * @constructor
 */
export function SelectVault({handleOpen}: SelectVaultProps) {
    function handleAdd(s: string[]) {
        if (s.length === 0) return
        invoke('load_meta', {
            filePath: s[0]
        })
            .then((d: any) => {
                const full_info: PublicVaultInfo = {...d, path: s[0]}
                handleOpen(full_info);
            })
            .catch(console.error)
    }

    async function openFile() {
        try {
            const files = await selectFile(false, VaultFilter);
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

    function handleError(e: any) {
        throw e
    }

    return <div className="dropdown is-hoverable">
        <div className="dropdown-trigger">
            <button className="button" aria-haspopup="true" aria-controls="dropdown-menu">
                Open my vault
            </button>
        </div>
        <div className="dropdown-menu" id="dropdown-menu" role="menu">
            <div className="dropdown-content">
                <a className="dropdown-item" onClick={() => handleOpen()}>
                    Cloud backed
                </a>
                <a href="#" className="dropdown-item" onClick={openFile}>
                    Open from file
                </a>
            </div>
        </div>
    </div>

    //return <OpenButton handleAdd={handleAdd} handleError={handleErr} text='Open my vault' isVault={true}/>
}
