import {FileEntry} from '@tauri-apps/api/fs'

type HandleSelect = (i: string) => void
type HandleDelete = (i: string, isDir: boolean) => void

export interface FileListProps {
    items: FileEntry[]
    handleSelected: HandleSelect
    handleDelete: HandleDelete

}

// Get file name from path. First tries Unix path, then windows.
// If it can't separate, returns entire path.
export function getName(path: string, separator = '/'): string {
    const parts = path.split(separator)

    if (parts.length > 1) {
        return parts[parts.length - 1]
    }
    if (separator == '/') {
        return getName(path, '\\')
    }
    return path
}

export function FileList({items, handleSelected, handleDelete}: FileListProps) {
    return (
        <table className='table is-fullwidth is-hoverable'>
            <thead>
            <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Remove</th>
            </tr>
            </thead>
            <tbody>
            {
                items.map(file => <FileRow
                    file={file} handleSelect={handleSelected} handleDelete={handleDelete}
                    key={file.path}/>)
            }
            </tbody>
        </table>
    )
}

interface FileRowProps {
    file: FileEntry
    handleSelect: HandleSelect
    handleDelete: HandleDelete
}

function FileRow({file, handleDelete, handleSelect}: FileRowProps) {
    const {name, children, path} = file
    const isFolder = Array.isArray(children)
    // Tauri does not guarantee a name. If there isn't one, use our own name method
    const definiteName = name || getName(path)

    const selectClick = () => {
        if (isFolder) {
            handleSelect(definiteName)
        }
    }

    return (
        <tr key={path} style={{cursor: 'pointer'}} onClick={selectClick}>
            <td>{definiteName}</td>
            <td>{isFolder ? 'Folder' : 'File'}</td>
            <td>
                <button
                    className='button is-small is-danger is-light'
                    onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(path, isFolder)
                    }}
                >Delete
                </button>
            </td>
        </tr>
    )
}
