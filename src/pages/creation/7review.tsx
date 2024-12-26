import {PageProps} from './index.tsx'
import {PageHeader, SectionHeader, SectionSubHeader} from '../../shared/Headers.tsx'
import {ContinueButton, Footer, FooterButton} from '../../shared/Footer.tsx'
import {DurationUnit, secondsToUnits} from './5updates.tsx'
import {validateEmail, validateName, VaultType} from './VaultInfo.tsx'
import {PageWrapper} from '../../shared'
import {useEffect, useState} from 'react'
import {ValidationError} from '../../util/constants.ts'
import {ErrorText} from '../../shared/Errors.tsx'

// Allows user to review choices and picks up errors (Such as missing name/email address) that they have made.
export function ReviewPage({goNext, goBack, vaultInfo}: PageProps) {
    const {
        alert_duration, share_config, reminder_period
        , personal_info, vault_type
    } = vaultInfo
    const {circles, required} = share_config || {circles: []}
    const requiredCircles: string = circles.filter(c => c.required).map(c => c.name).join(', ')
    const {
        name, full_legal_name, address, guidance_doc,
        phone_number, email_address
    } = personal_info || {}
    const [error, setError] = useState<string | undefined>()

    // validation
    useEffect(() => {
        try {
            if (!name) {
                throw new ValidationError('You need to set your name on the personal information page.')
            } else if (!email_address) {
                throw new ValidationError('You need to set your email address on the personal information page.')
            }
            validateName(name)
            validateEmail(email_address)
        } catch (err) {
            if (err instanceof Error) {
                return setError(err.message)
            }
            if (typeof err === 'string') {
                return setError(err)
            }
            if (err) {
                setError(err.toString())
            }
        }
    }, [vaultInfo])

    const NA = 'Not provided'

    let notificationEle
    if (!alert_duration) {
        notificationEle = (
            <p>
                You will not get a notification when an unlock attempt is made.<br/>
                Your data will be available immediately when keys are combined.
            </p>
        )
    } else {
        const [value, units] = secondsToUnits(alert_duration)

        notificationEle = (
            <p>
                You will get a notification when an unlock attempt is made.<br/>
                You will have <strong>{value}</strong> {DurationUnit[units]} to respond before access is given.
            </p>
        )
    }

    return (
        <PageWrapper>
            <div>
                <PageHeader>Review</PageHeader>
                <p>
                    Your choices are summarised below. Please check that they are correct. When you are ready, click the
                    button to encrypt and export your data. <br/>
                    Once you move on from this page, you cannot go back until the encryption is finished.
                    You have selected a{vault_type === VaultType.Offline ? 'n offline vault' : ' cloud backed vault'}.

                </p>

                <SectionHeader className="mt-3">Personal information</SectionHeader>
                <div className="columns is-mobile">
                    <div className="column is-4">
                        <SectionSubHeader>Information for cloud service</SectionSubHeader>
                        <p>
                            Name: {name || NA} <br/>
                            Email: {email_address || NA}
                        </p>
                    </div>

                    <div className="column is-4">
                        <SectionSubHeader>Information within vault</SectionSubHeader>
                        <p>
                            Legal name: {full_legal_name || NA}<br/>
                            Phone number: {phone_number || NA}<br/>
                            Guidance document: {guidance_doc || NA}<br/>
                            Address: {address || NA}<br/>
                        </p>
                    </div>
                </div>

                <div className="columns is-mobile pt-6 mb-6">
                    <div className="column is-4">
                        <SectionSubHeader>Share configuration</SectionSubHeader>
                        <p>{required} keys will be required to access your data
                            across {circles ? circles.length : 0} circles.
                        </p>
                        <p>{requiredCircles} are marked as required, so at least one keyholder from those groups must
                            participate to unlock.
                        </p>
                    </div>

                    <div className="column is-4">
                        <SectionSubHeader>Notifications</SectionSubHeader>
                        {notificationEle}
                        {
                            reminder_period
                                ? <p>
                                    You will get a reminder to update your data
                                    every <strong>{reminder_period}</strong> months.
                                </p>
                                : <p>You will not get a reminder to keep your data up to date.</p>
                        }
                    </div>
                </div>


            </div>
            <ErrorText>{error}</ErrorText>
            <Footer>

                <ContinueButton handleClick={goNext} text='Continue' disabled={!!error}/>
                <FooterButton handleClick={goBack}/>

            </Footer>
        </PageWrapper>
    )
}
