import {useState} from 'react'
import {PageProps} from '.'
import {PageHeader, SectionHeader} from '../../shared/Headers'
import {byteArrayToKeyString, displayKey} from '../../util'
import {ContinueButton, Footer} from '../../shared/Footer.tsx'
import {writeText} from '@tauri-apps/api/clipboard'
import {PageWrapper} from '../../shared'
import {saveKey} from "../../util/fileApi.ts";

// Main key page allows the main keep to be saved.
// This page was originally called the master key page but was renamed along with all other references to master key as that term can be problematic.
// This page is relatively simple. The user cannot progress beyond it until they save the key.
export function MainkeyPage({vaultInfo, goNext}: PageProps) {
    if (!vaultInfo || vaultInfo.keys === undefined) throw new Error('Made it to main key page w/o keys set')

    // Add cloud key if present
    const fullKey = vaultInfo.cloud_creds ? [...vaultInfo.keys.main, ...vaultInfo.cloud_creds.owner_token] : vaultInfo.keys.main;
    const str = byteArrayToKeyString(fullKey)
    const [copied, setCopied] = useState<boolean>(false)

    return (
        <PageWrapper>
            <PageHeader>Share keys</PageHeader>
            <SectionHeader>Save your main key</SectionHeader>
            <p>
                <strong>First, save your key in a safe place.</strong> You will need it whenever you want to access your
                encrypted data,
                and
                to keep it up to date.<br/>
                You should never share your main key. Once you have saved this key, you will share your key
                shares.<br/><br/><br/>
            </p>

            <div className='columns'>
                <div className='column is-6 is-offset-2'>
                    <SectionHeader>Keys</SectionHeader>

                    <p>Main ({displayKey(vaultInfo.keys.main)})</p>
                    <div className="buttons">
                        <button className="button" onClick={() => {
                            writeText(str).catch(console.error)
                            setCopied(true)
                        }}
                        >Copy key
                        </button>

                        <button className="button" onClick={() => {
                            saveKey(str, "main", true).catch(console.error)
                            setCopied(true)
                        }}
                        >Save keyfile
                        </button>
                    </div>

                </div>
                <div className='column is-2'>
                    <SectionHeader>Key copied</SectionHeader>
                    <p>
                        {copied ? '✅' : '❌'}
                    </p>
                </div>
            </div>
            <Footer>
                <ContinueButton handleClick={goNext} text='Share key pieces' disabled={!copied}/>
            </Footer>
        </PageWrapper>
    )
}
