import {getName} from './FileList.tsx'

export interface BreadcrumbProps {
    crumbs: string[]
    goUp: () => void
}

export const Breadcrumb = ({crumbs, goUp}: BreadcrumbProps) => {
    return (
        <div className='import-columns'>
            <div style={{marginRight: '1rem'}}>
                <button className='button is-small is-inline' disabled={crumbs.length === 0} onClick={() => goUp()}>Up
                </button>
            </div>
            <div>
                <nav className='breadcrumb' aria-label='breadcrumbs'>
                    <ul>

                        <li/>
                        {crumbs.map((crumb) => (<li className='is-active' key={crumb}>
                            <a href='#'>{getName(crumb)}</a>
                        </li>))}
                    </ul>
                </nav>
            </div>
        </div>
    )
}
