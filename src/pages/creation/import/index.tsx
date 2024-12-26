import {PageProps} from '../index.tsx'
import {PageHeader} from '../../../shared/Headers.tsx'
import {ImportSidebar} from './sidebar.tsx'
import {StandardFooter} from '../../../shared/Footer.tsx'
import {FileBrowser} from './FileBrowser'
import {useEffect, useRef, useState} from 'react'
import {createVaultFolder, openVaultFolder, VaultFolder} from '../../../util/fileApi.ts'
import {getName} from './FileBrowser/FileList.tsx'
import {FileEntry} from '@tauri-apps/api/fs'
import {AppError, castErr, ErrorDisplay} from '../../../shared/Errors.tsx'

/*
 * Import data page.
 * Made up of a sidebar and file browser.
 * Unlike a typical file browser implementation, this version does not use trees or represent files as nodes.
 * It is an interface onto the real file system. It allows the user to add folders and files as you would expect - and
 * when they do so actually adds those files to an internal temporary folder. The name of the temporary folder is randomly
 * generated so it is unique across creations.
 * I chose to use this method as I had trouble getting a fully custom way to work. And it was the easiest way to get nested
 * folders.
 */
export const ImportData = ({goNext, goBack, vaultInfo, setVaultInfo}: PageProps) => {
    const [path, setPath] = useState<string[]>([])
    const [vaultFolder, setVaultFolder] = useState<VaultFolder | undefined>()
    const [items, setItems] = useState<FileEntry[]>([])
    const [error, setError] = useState<AppError | undefined>()

    // Lovely generic function to handle async errors.
    async function handleErr<T>(prom: Promise<T>): Promise<T> {
        prom.catch(e => {
            console.error(e)
            setError(castErr(e))
        })
        return await prom
    }

    const called = useRef(false);
    // Either create a new vault folder or open the existing one.
    // Only does it when the path is updated or vaultFolder changes.
    useEffect(() => {
        if (!called.current && (vaultFolder == null)) {
            called.current = true;
            (async () => {
                let folder: VaultFolder
                if (vaultInfo.vault_folder) {
                    folder = await openVaultFolder(vaultInfo.vault_folder)
                } else {
                    folder = await createVaultFolder()
                    setVaultInfo({vault_folder: folder.getPath()})
                }
                setVaultFolder(folder)
            })().catch(e => setError(castErr(e)))
        }
    }, [])

    useEffect(refreshItems, [path, vaultFolder])

    function refreshItems() {
        if (vaultFolder != null) {
            handleErr((async () => {
                const items = await vaultFolder.getItems(path)
                setItems(items)
            })())
        }
    }

    if (vaultFolder == null) {
        return (
            <div>
                <p>Loading</p>
                <ErrorDisplay error={error}/>
            </div>
        )
    }

    const addFile = (filePath: string) => {
        handleErr(vaultFolder.addFile([...path, getName(filePath)], filePath)).then(() => refreshItems())
    }

    const removeFile = (path: string, isDirectory: boolean) => {
        console.log('CALLED')
        const prom = isDirectory ? vaultFolder.removeDir(path) : vaultFolder.removeFile(path)
        handleErr(prom)
            .then(() => refreshItems())
    }

    const moveFolder = (folderPath: string) => {
        handleErr(vaultFolder.moveDir([...path, getName(folderPath)], folderPath)).then(() => refreshItems())
    }

    return (
        <div className='stack'>
            <div className='import-top static'>
                <PageHeader>My data</PageHeader>
            </div>
            <div className='import-columns fill'>
                <div style={{width: '20%'}}>
                    <ImportSidebar
                        addFile={addFile}
                        createFolder={async (name: string) => await vaultFolder.addDir([...path, name])}
                        moveFolder={moveFolder}
                    />
                </div>

                <div className='stack' id='import-right'>
                    <div className='static'>
                        <ErrorDisplay error={error}/>
                    </div>
                    <div className='fill'>
                        <FileBrowser
                            items={items}
                            path={path}
                            goUp={() => setPath(path.slice(0, -1))}
                            add={i => setPath([...path, i])}
                            remove={removeFile}
                        />
                    </div>

                    <div className='static'>
                        <StandardFooter handleContinue={goNext} handleBack={goBack}/>
                    </div>
                </div>
            </div>

        </div>
    )
}