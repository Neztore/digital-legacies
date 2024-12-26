import {ChangeEvent, useState} from 'react'
import {PageHeader, SectionHeader} from '../../shared/Headers.tsx'
import {StandardFooter} from '../../shared/Footer.tsx'
import {PageProps} from './index.tsx'
import {ValidationError} from '../../util/constants.ts'
import {PersonalInfo, validateEmail, validateName} from './VaultInfo.tsx'
import {PageWrapper} from '../../shared'

// Allows the user to input their personal information, and validates the name and email address fields.
export function PersonalInfoPage({goNext, goBack, vaultInfo, setVaultInfo}: PageProps) {
    const [nameError, setNameErr] = useState<string | undefined>()
    const [emailError, setEmailErr] = useState<string | undefined>()

    // Handle changes to name: Validate and save in vault object.
    function handleNameUpdate(e: ChangeEvent<HTMLInputElement>) {
        const name = e.target.value

        try {
            validateName(name)
            setNameErr('')
        } catch (error) {
            if (error instanceof ValidationError) {
                setNameErr(error && error.message ? error.message : '')
            } else {
                throw error
            }
        }
        setVaultInfo({personal_info: {...vaultInfo.personal_info, name}})
    }

    function handleEmailUpdate(e: ChangeEvent<HTMLInputElement>) {
        const emailAddress = e.target.value

        try {
            validateEmail(emailAddress)
            setEmailErr('')
        } catch (error) {
            if (error instanceof ValidationError) {
                setEmailErr(error && error.message ? error.message : '')
            } else {
                throw error
            }
        }
        setVaultInfo({personal_info: {...vaultInfo.personal_info, email_address: emailAddress}})
    }

    // These fields are not validated.
    function handleExtraUpdate(name: keyof PersonalInfo, value: string) {
        if (!value || !value.trim()) {
            setVaultInfo({personal_info: {...vaultInfo.personal_info, [name]: undefined}})
        } else {
            setVaultInfo({personal_info: {...vaultInfo.personal_info, [name]: value}})
        }
    }

    return (
        <>
            <PageWrapper>
                <PageHeader>Personal information</PageHeader>
                <SectionHeader>Core personal information</SectionHeader>

                <div className='columns is-mobile'>
                    <div className='column is-4'>
                        <p>This information is stored within your vault and on the server if vault unlock notifications
                            are
                            enabled.
                        </p>
                        <div className='field'>
                            <label className='label'>Name <span className="small">(Required)</span></label>
                            <div className='control'>
                                <input
                                    className='input' type='text'
                                    value={vaultInfo.personal_info?.name || ''}
                                    onChange={handleNameUpdate}
                                />
                                <span className='error-text'>{nameError || ''}</span>
                            </div>
                        </div>
                        <div className='field'>
                            <label className='label'>Email address <span className="small">(Required)</span></label>
                            <div className='control'>
                                <input
                                    className='input' type='email' placeholder='yourname@domain.com'
                                    value={vaultInfo.personal_info?.email_address || ''}
                                    onChange={handleEmailUpdate}
                                />
                                <span className='error-text'>{emailError || ''}</span>
                            </div>
                        </div>

                        <SectionHeader>Extra information</SectionHeader>
                        <p>This information is optional, and is stored encrypted within your vault. It may be useful for
                            recipients.
                        </p>

                        <div className='field'>
                            <label className='label'>Full legal name <span className="small">(Optional)</span></label>
                            <div className='control'>
                                <input
                                    className='input' type='text'
                                    value={vaultInfo.personal_info?.full_legal_name || ''}
                                    onChange={(e) => handleExtraUpdate('full_legal_name', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className='field'>
                            <label className='label'>Phone number <span className="small">(Optional)</span></label>
                            <div className='control'>
                                <input
                                    className='input' type='text'
                                    value={vaultInfo.personal_info?.phone_number || ''}
                                    onChange={(e) => handleExtraUpdate('phone_number', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className='field'>
                            <label className='label'>Guidance document <span className="small">(Optional)</span></label>
                            <div className='control'>
                                <input
                                    className='input' type='text'
                                    value={vaultInfo.personal_info?.guidance_doc || ''}
                                    onChange={(e) => handleExtraUpdate('guidance_doc', e.target.value)}
                                />
                            </div>
                            <p className='help'>Provide the name of a file, like a README, that recipients should open
                                first.
                            </p>
                        </div>

                        <div className='field'>
                            <label className='label'>Address <span className="small">(Optional)</span></label>
                            <div className='control'>
                                <input
                                    className='input' type='text'
                                    value={vaultInfo.personal_info?.address || ''}
                                    onChange={(e) => handleExtraUpdate('address', e.target.value)}
                                />
                            </div>
                        </div>

                    </div>
                </div>

                <StandardFooter handleContinue={goNext} handleBack={goBack}/>
            </PageWrapper>

        </>
    )
}
