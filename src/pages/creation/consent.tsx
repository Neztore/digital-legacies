import {PageProps} from './index.tsx'
import {PageWrapper} from '../../shared'
import {PageHeader, SectionSubHeader} from '../../shared/Headers.tsx'
import {VaultType} from './VaultInfo.tsx'
import {ContinueButton, Footer, FooterButton} from '../../shared/Footer.tsx'
import {useState} from 'react'

// Requires the user to consent to processing. The user cannot progress beyond this page without consenting.
export function ConsentPage({vaultInfo, goBack, goNext}: PageProps) {
    const [hasConsented, setHasConsented] = useState<boolean>(false)
    return (
        <PageWrapper>
            <PageHeader>Please consent to data processing</PageHeader>
            <SectionSubHeader>Your consent is needed to create your vault as it may contain special category
                data.</SectionSubHeader>
            <p>By clicking the button below you consent to your data being processed to provide your vault. You also
                assert that you have checked the data for the data identifying any other individuals, and have got their
                explicit
                consent to include it.</p>
            <p>You should also include instructions to your recipients on how to handle your data. This could be within
                the vault, or when you send them their keys.</p>
            <br/>
            <div className='content'>
                <p>When you click encrypt:</p>
                <ul>
                    <li>
                        Your data will be compressed into an archive and encrypted using Authenticated Encryption with
                        Associated Data (AEAD).
                    </li>
                    <li>
                        All of the files you imported, the configuration options you have chosen and personal
                        information you added will be included in this archive.
                    </li>
                    <li>
                        Your name, email address and basic trust circle structure (circle names, numbers of keys, and
                        whether a circle is required) will be digitally signed to prevent them being modified, and they
                        will be added to the vault file.
                    </li>
                    <ul>
                        <li>
                            This data is "public" - anyone with the vault file and ability to decode the binary format
                            can access it.
                        </li>
                        <li>It is required to identify you as the data subject and to make decryption for your
                            recipients.
                        </li>
                    </ul>
                    <li>Once the data is encrypted, key pieces will be generated according to your settings. You should
                        keep these safe and distribute them to your contacts in a secure way.
                    </li>
                </ul>
            </div>
            {vaultInfo.vault_type === VaultType.Cloud
                ? <div>
                    <SectionSubHeader>Cloud vault</SectionSubHeader>
                    <p>You have selected a cloud vault. This means your encrypted data will be uploaded to a Cloud
                        storage service, which will store it in AWS Glacier</p>
                    <p>The same protection applies - only public data can be read. Your name and email address will be
                        stored on the storage service if you have enabled unlock notifications or reminders so that
                        those alerts can be sent.</p>
                    <p>Your vault will only be provided to users who can present a Cloud Secret. This is encoded within
                        the key pieces and they must be combined to obtain it.</p>
                    <p>By clicking encrypt you also agree to this processing, and your data being uploaded for this
                        purpose. You can delete your data at any time by <strong>?</strong>.</p>
                </div>

                : ''}

            <div className='field mt-4'>
                <div className='control'>
                    <label className='label'> <input className='checkbox' type='checkbox' value={'' + hasConsented}
                                                     onChange={() => setHasConsented(!hasConsented)}/> I
                        have read to, and agree to all of the above processing. I have checked the data and obtained
                        consent for any data related to others.
                    </label>

                </div>
            </div>

            <Footer>
                <ContinueButton handleClick={goNext} text='Encrypt' disabled={!hasConsented}/>
                <FooterButton handleClick={goBack}/>

            </Footer>
        </PageWrapper>
    )
}
