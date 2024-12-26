import {PageProps} from './index.tsx'
import {byteArrayToKeyString, displayKey} from '../../util'
import {useState} from 'react'
import {PageHeader, SectionHeader} from '../../shared/Headers.tsx'
import {writeText} from '@tauri-apps/api/clipboard'
import {ContinueButton, Footer, FooterButton} from '../../shared/Footer.tsx'
import {PageWrapper} from '../../shared'
import {CircleDisplay} from './shares/Circle.tsx'
import {exit} from '@tauri-apps/api/process'
import {saveKey} from "../../util/fileApi.ts";
import {open} from '@tauri-apps/api/shell';

// Allows key pieces to be saved and shared. The user cannot progress beyond this page until all keys and saved, and it
// Lets them either exit or go back to the welcome screen.
export function ShareKeysPage({vaultInfo, goBack}: PageProps) {
    if (!vaultInfo || (vaultInfo.keys == null)) throw new Error('No keys')
    const [copied, setCopied] = useState<number[]>([])
    const totalKeys = vaultInfo.keys?.share_keys.reduce((acc, circle) => acc + ((circle.keys != null) ? circle.keys.length : 0), 0)

    const allCopied = copied.length >= totalKeys

    function hasCopied(index: number) {
        const newCopied = [...copied, index];
        setCopied(newCopied)
    }

    const handleCopyOrSave = (fn: Function, index: number, arr: number[], comment: string) => {
        const str = byteArrayToKeyString(arr);
        fn(str, comment).catch(console.error)

        hasCopied(index);
    }

    /**
     * Provide a mailto link which will open in the default mail application with a pre-filled email including the key piece.
     * @param index Number - Index of the key being saved. Used to update the record of which keys have been updated.
     * @param arr Array of bytes - the raw key piece.
     */
    function emailShare(index: number, arr: number[]) {
        const key = byteArrayToKeyString(arr);
        const name = vaultInfo.personal_info?.name || ""
        open(`mailto:?subject=Digital%20Vault%20keyshare&body=I%20have%20created%20a%20digital%20vault%20which%20contains%20my%20digital%20legacy.%20This%20may%20include%20my%20files%2C%20last%20will%20and%20testament%20and%20other%20data%20-%20I%20have%20used%20the%20Protecting%20Digital%20Legacies%20application%20to%20do%20this%2C%20and%20would%20like%20you%20to%20have%20a%20keyshare.A%20number%20of%20key%20pieces%20must%20be%20combined%20to%20unlock%20my%20data%2C%20and%20I%20have%20given%20one%20of%20these%20key%20pieces%20to%20some%20of%20my%20contacts.%20If%20I%20die%20or%20...%2C%20I%20would%20like%20you%20to%20come%20together%20and%20access%20my%20data.%3Cbr%2F%3EThanks,%3Cbr%2F%3E${name}%3Cbr%2F%3E%3Cbr%2F%3EKey:%3Cbr%2F%3E${key}`)
            .then(() => {
                hasCopied(index);
            })
            .catch(console.error)
    }

    /**
     * Open the WhatsApp API to allow keys to be securely shared. WhatsApp chosen as it is very widely used, and it is end-to-end encrypted.
     * @param index index Number - Index of the key being saved. Used to update the record of which keys have been updated.
     * @param arr Array of bytes - the raw key piece.
     */
    function whatsappShare(index: number, arr: number[]) {
        const key = byteArrayToKeyString(arr);
        const name = vaultInfo.personal_info?.name || ""
        open(`https://api.whatsapp.com/send?text=I%20have%20created%20a%20digital%20vault%20which%20contains%20my%20digital%20legacy.%20This%20may%20include%20my%20files%2C%20last%20will%20and%20testament%20and%20other%20data%20-%20I%20have%20used%20the%20Protecting%20Digital%20Legacies%20application%20to%20do%20this%2C%20and%20would%20like%20you%20to%20have%20a%20keyshare.A%20number%20of%20key%20pieces%20must%20be%20combined%20to%20unlock%20my%20data%2C%20and%20I%20have%20given%20one%20of%20these%20key%20pieces%20to%20some%20of%20my%20contacts.%20If%20I%20die%20or%20...%2C%20I%20would%20like%20you%20to%20come%20together%20and%20access%20my%20data.\nThanks, ${name}\n\n\n Key:\n${key}`)
            .then(() => {
                hasCopied(index);
            })
            .catch(console.error)
    }

    /**
     * Exit the application when exit is clicked and all keys have been copied.
     */
    function handleNext() {
        if (allCopied) {
            exit(0).catch(console.error)
        }
    }

    return (
        <PageWrapper>
            <PageHeader>Share keys</PageHeader>
            <SectionHeader>Send keys to recipients</SectionHeader>
            <p>
                You are now all set up. You should distribute these keys, and explain to your recipients what they
                are.<br/>
                Each keyfile is encoded in plaintext and includes a basic guide on how to access your information.<br/>
            </p>

            {vaultInfo.keys.share_keys.map(circle => {
                return (
                    <CircleDisplay title={circle.name} middle='' right={<div/>}>
                        <table className='table is-fullwidth'>
                            <thead>
                            <tr>
                                <th>Key</th>
                                <th>Comment</th>
                                <th>Share options</th>
                                <th>Key stored/shared</th>
                            </tr>

                            </thead>
                            <tbody>
                            {circle.keys?.map((i, index) => <tr key={`key-${i[0]}-${index}`}>
                                <td>
                                    Key {i[0]} ({displayKey(i)})

                                </td>
                                <td>{circle.key_comments[index]}</td>
                                <td>
                                    <div className="buttons">
                                        <button className='button is-small'
                                                onClick={() => handleCopyOrSave(writeText, i[0], i, circle.key_comments[index])}>Copy
                                            to clipboard
                                        </button>
                                        <button className='button is-small'
                                                onClick={() => handleCopyOrSave(saveKey, i[0], i, circle.key_comments[index])}>Save
                                            to file
                                        </button>
                                        <button className="button is-small" onClick={() => whatsappShare(i[0], i)}>Share
                                            in WhatsApp
                                        </button>
                                        <button className="button is-small" onClick={() => emailShare(i[0], i)}>Share
                                            via Email
                                        </button>
                                    </div>

                                </td>
                                <td>
                                    {copied.includes(i[0]) ? '✅' : '❌'}
                                </td>
                            </tr>)}

                            </tbody>

                        </table>

                    </CircleDisplay>
                )
            })}

            <div className='columns'>
                <div className='column is-8'/>
            </div>
            <Footer>
                <ContinueButton handleClick={handleNext} disabled={!allCopied} text='Exit'/>
                <FooterButton handleClick={() => goBack(true)} disabled={!allCopied} text='Go home'/>
                <FooterButton handleClick={() => goBack()}/>
            </Footer>
        </PageWrapper>
    )
}
