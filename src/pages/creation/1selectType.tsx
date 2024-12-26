import {PageHeader} from '../../shared/Headers.tsx'
import {PageProps} from './index.tsx'
import {VaultType} from './VaultInfo.tsx'
import {PageWrapper} from '../../shared'
import {CircleDisplay} from './shares/Circle.tsx'
import {Footer, FooterButton} from '../../shared/Footer.tsx'
import {useState} from "react";
import {AppError, castErr, ErrorDisplay} from "../../shared/Errors.tsx";
import {deleteVault} from "../../util/cloudApi.ts";


export function SelectTypePage({goNext, setVaultInfo, goBack, vaultInfo}: PageProps) {
    const [error, setError] = useState<AppError | undefined>();

    function setType(type: VaultType) {
        setVaultInfo({vault_type: type})
        return goNext()
    }

    const type = vaultInfo.vault_type;

    function handleDelete() {
        if (!vaultInfo || !vaultInfo.cloud_creds) {
            return setError({
                error_type: "fatal", message: "No cloud credentials available"

            })
        }
        deleteVault(vaultInfo.cloud_creds.owner_token)
            .then(() => {
                goBack(true);
            })
            .catch(e => setError(castErr(e)));
    }

    return (
        <PageWrapper>
            <PageHeader>Choose a vault type</PageHeader>
            <ErrorDisplay error={error}/>
            <div className='columns'>
                <div className='column is-3'>
                    <CircleDisplay title={`Cloud-backed ${type === VaultType.Cloud ? "(current)" : ""}`} middle=''
                                   right={<div/>}
                                   handleClick={() => setType(VaultType.Cloud)}
                                   className={type === VaultType.Cloud ? "is-required" : undefined}>
                        Features
                        <div className='content'>
                            <ul>
                                <li>
                                    Unlock notifications
                                </li>
                                <li>
                                    Override vault opening
                                </li>
                                <li>
                                    Cloud backup to keep your data safe
                                </li>
                                <li>
                                    Export a backup offline copy
                                </li>
                            </ul>
                        </div>

                    </CircleDisplay>
                </div>
                <div className='column is-3'>
                    <CircleDisplay title={`Offline only ${type === VaultType.Offline ? "(current)" : ""}`} middle=''
                                   right={<div/>}
                                   handleClick={() => setType(VaultType.Offline)}
                                   className={type === VaultType.Offline ? "is-required" : undefined}>
                        Features
                        <div className='content'>
                            <ul>
                                <li>
                                    No external parts
                                </li>
                                <li>
                                    Unlock data offline
                                </li>
                                <li>
                                    No alerts or overrides
                                </li>
                                <li>
                                    Completely private and local - back it up yourself
                                </li>
                            </ul>
                        </div>

                    </CircleDisplay>
                </div>
            </div>
            <p className=''>Both types of digital vault use zero-knowledge encryption to ensure that only you can access
                your data.</p><br/>
            <div className="columns mt-4">
                <div className="column is-4">
                    <div className="level">
                        <div className="level-left">
                            <Footer>
                                <FooterButton handleClick={goBack}/>

                            </Footer>
                        </div>
                        {type === VaultType.Cloud && vaultInfo.cloud_creds ?
                            <div className="level-right">
                                <button className="button is-danger" onClick={() => handleDelete()}>Delete cloud vault
                                </button>
                            </div>
                            : ""}
                    </div>
                </div>
            </div>


        </PageWrapper>
    )
}
