import {VaultType} from '../creation/VaultInfo.tsx'
import {PageHeader, SectionSubHeader} from '../../shared/Headers.tsx'
import {UnlockPageProps} from './index.tsx'
import {PageWrapper} from '../../shared'
import {Footer, FooterButton} from '../../shared/Footer.tsx'
import {PropsWithChildren} from 'react'
import {OpenOffline} from "./2import.tsx";

export function ChooseType({goNext, setVaultInfo, goBack}: UnlockPageProps) {
    function handleClick(type: VaultType) {
        setVaultInfo({vault_type: type})
        return goNext()
    }

    return (
        <PageWrapper>
            <div>
                <PageHeader>Unlock process</PageHeader>
                <SectionSubHeader>Sorry for your loss.</SectionSubHeader>
                <p>
                    There are a few stages to the unlock process, and get access to the data. <br/>
                    How this works depends on whether it is a cloud-backed or offline vault. It will indicate in your
                    key what type of vault it is.
                </p>

                <Hdr>Cloud-backed vault</Hdr>
                <p>
                    A cloud backed vault is stored online. If all you have is a
                    set of key pieces, use this method.<br/>

                    The owner may get a notification when you unlock the vault, and there may be an opening delay.
                </p>
                <p>
                    If the request is not answered during this time, access is granted by default.
                </p>
                <button
                    className='button mt-2'
                    onClick={() => handleClick(VaultType.Cloud)}
                >Access cloud-backed
                </button>

                <Hdr>Access using vault file and keys</Hdr>
                <p className="mb-2">
                    If you have a copy of the vault file and all the key shares needed, you can unlock the data
                    without going through the cloud process, and waiting the unlock notification period.<br/>
                    To do this you must have both enough keys and an offline vault backup or vault file.<br/>
                    This process does not require an internet connection.
                </p>
                <OpenOffline setVaultInfo={setVaultInfo} goNext={goNext} text="Access using vaultfile"/>

                <br/>
                <br/>
            </div>
            <br/>
            <Footer>
                <FooterButton handleClick={goBack}/>
            </Footer>
        </PageWrapper>
    )
}

const Hdr = ({children}: PropsWithChildren<{}>) => <SectionSubHeader className='mt-5 mb-1'>{children}</SectionSubHeader>
