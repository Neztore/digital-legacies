import {Fragment, useState} from 'react'
import {PageHeader, SectionHeader, SectionSubHeader} from '../../shared/Headers.tsx'
import {UnlockPageProps} from './index.tsx'
import {ContinueButton, Footer, FooterButton} from '../../shared/Footer.tsx'
import {PageWrapper} from '../../shared'
import {displayKey, keyStringToByteArray} from '../../util'
import {EnterKey} from "../../shared/EnterKey.tsx";
import {PublicVaultInfo} from "./Unlockinfo.tsx";

type TopTextProps = {
    publicInfo?: PublicVaultInfo,
    keyCount: number

}

function TopText({publicInfo, keyCount}: TopTextProps) {
    if (publicInfo) {
        const {name, email_address, share_config: {circles, required}} = publicInfo
        const requiredGroups = circles.filter(c => c.required).map(c => c.name).join(', ')

        return <Fragment>
            <PageHeader>Enter key pieces ({keyCount} of {required})</PageHeader>
            <SectionHeader>You can submit key pieces here. You need {required} to unlock the data.</SectionHeader>
            {requiredGroups.length
                ? <p>The following circles are marked as required, and you will need at least one key from
                    each: <code>{requiredGroups}</code>.
                </p>
                : <p>No circles are marked as required - you need {required} keys from any circle.</p>}

            <p>
                Vault Owner: {name}<br/>
                Email address: {email_address}
            </p>
        </Fragment>
    } else {
        return <Fragment>
            <PageHeader>Enter key pieces ({keyCount} submitted)</PageHeader>
            <SectionHeader>You can submit key pieces here. Once combined, you can download the vault.</SectionHeader>

        </Fragment>

    }
}

export function EnterKeys({vaultInfo: {vaultInfo: publicInfo, keys}, setVaultInfo, goNext, goBack}: UnlockPageProps) {
    const [submittedKeys, setSubmittedKeys] = useState<string[]>(keys || [])

    function submitTextKey(key: string) {
        if (!submittedKeys.includes(key.trim())) {
            setSubmittedKeys([...submittedKeys, key])
        }
    }

    function movePage() {
        setVaultInfo({keys: submittedKeys})
        goNext()
    }

    return (
        <PageWrapper>
            <div>
                <TopText publicInfo={publicInfo} keyCount={submittedKeys.length}/>

                <div className="columns is-mobile">
                    <div className="column is-6">
                        <EnterKey handleKey={submitTextKey}/>

                        <br/>
                        <br/>
                        <SectionSubHeader>Keys</SectionSubHeader>

                        <table className="table is-fullwidth">
                            <thead>
                            <tr>
                                <th>Key number{'  '}</th>
                                <th> Keys</th>

                            </tr>

                            </thead>
                            <tbody>
                            {submittedKeys.map((i) => <tr key={i}>
                                <td>
                                    {i.split(':')[0]}
                                </td>
                                <td>
                                    {displayKey(keyStringToByteArray(i))}
                                </td>

                            </tr>)}

                            </tbody>

                        </table>
                    </div>
                </div>
            </div>
            <Footer>
                <ContinueButton handleClick={movePage} text='Combine keys'
                                disabled={submittedKeys.length < (publicInfo ? publicInfo.share_config.required : 0)}/>
                <FooterButton handleClick={goBack}/>
            </Footer>
        </PageWrapper>
    )
}
