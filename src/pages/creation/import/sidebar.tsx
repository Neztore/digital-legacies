import {selectFile} from '../../../util/fileApi.ts'

export interface ImportSidebarProps {
    addFile: (filePath: string) => void
    createFolder: (folderName: string) => void
    moveFolder: (folderPath: string) => void

}

// Contains add folder or file buttons. Room for new functionality (social media...)
export const ImportSidebar = ({addFile, moveFolder}: ImportSidebarProps) => {
    function addFileClick(isFolder: boolean) {
        (async function () {
            const files = await selectFile(isFolder)

            for (const i of files) {
                if (isFolder) {
                    moveFolder(i)
                } else {
                    addFile(i)
                }
            }
        })().catch(console.log)
    }

    return (
        <aside className='menu sidebar'>
            <p className='menu-label'>
                Add new
            </p>
            <ul className='menu-list'>
                <li onClick={() => addFileClick(false)}><a>File</a></li>
                <li onClick={() => addFileClick(true)}><a>Folder</a></li>
            </ul>
            <p className='menu-label'>
                Add service
            </p>
            <ul className='menu-list'/>
        </aside>
    )
}
