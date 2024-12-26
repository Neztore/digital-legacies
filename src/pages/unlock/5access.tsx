import {PageHeader, SectionHeader} from '../../shared/Headers.tsx'
import {UnlockPageProps} from './index.tsx'

export function AccessPage({vaultInfo}: UnlockPageProps) {

    return (
        <div className='hero is-fullheight'>
            <div className='hero-body'>
                <div>
                    <PageHeader>Data unlocked</PageHeader>
                    <SectionHeader>The files have been saved in your chosen location.</SectionHeader>
                    <p>{vaultInfo.finalPath}</p>
                </div>

            </div>
        </div>
    )
}
