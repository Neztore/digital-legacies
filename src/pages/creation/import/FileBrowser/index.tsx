import {FileList} from './FileList.tsx'
import {Breadcrumb} from './Breadcrumb.tsx'
import {FileEntry} from '@tauri-apps/api/fs'

export interface FileBrowserProps {
    items: FileEntry[]
    path: string[]
    add: (p: string) => void
    goUp: () => void
    remove: (path: string, isDirectory: boolean) => void
}

export const FileBrowser = ({items, path, add, goUp, remove}: FileBrowserProps) => {
    /* function handleCrumbClick (str: string) {
          let currFolder = currentFolder.children;
          // Work out what was clicked
          for (const crumb of breadcrumbs) {
              const crumbItem = findFromArr(currFolder, crumb);

              if (!crumbItem) {
                  console.error("failed to find item for breadcrumb... going to return to top level.");
                  setBreadcrumbs([]);
                  return setCurrentFolder(null);
              }

              if (str === crumb) {
                  return setCurrentFolder(crumbItem)
              } else {
                  currFolder = crumbItem.children;
              }
          }
      } */

    return (
        <div>
            <Breadcrumb crumbs={path} goUp={goUp}/>
            <FileList items={items} handleSelected={add} handleDelete={remove}/>
        </div>
    )
}
