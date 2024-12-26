import {PageProps} from './index.tsx'
import {useEffect, useState} from 'react'
import {PageHeader, SectionHeader, SectionSubHeader} from '../../shared/Headers.tsx'
import {StandardFooter} from '../../shared/Footer.tsx'
import {PageWrapper} from '../../shared'

const DEFAULT_DURATION = 7
const DEFAULT_REMINDER = 6

export enum DurationUnit {
    minutes,
    hours,
    days,
    weeks
}

const SECONDS_TO_MINUTES = 60
const MINUTES_TO_HOURS = 60
const HOURS_TO_DAYS = 24
const DAYS_TO_WEEKS = 7

/**
 * Convert seconds to a number and duration unit tuple. The UI allows time to unlock to be inputted in minutes, hours, days and weeks.
 * The underlying vault functionality only deals with seconds so when re-opening this page or updating an existing vault we need to convert
 * from seconds to those units. Returns the largest unit which the seconds count can fit in and be greater than 1.
 * @param seconds Seconds to convert.
 */
export function secondsToUnits(seconds: number): [number, DurationUnit] {
    let result = seconds / SECONDS_TO_MINUTES
    let unit = DurationUnit.minutes

    const hours = result / MINUTES_TO_HOURS

    if (hours >= 1) {
        const days = hours / HOURS_TO_DAYS
        if (days >= 1) {
            const weeks = days / DAYS_TO_WEEKS
            if (weeks >= 1) {
                result = weeks
                unit = DurationUnit.weeks
            } else {
                result = days
                unit = DurationUnit.days
            }
        } else {
            result = hours
            unit = DurationUnit.hours
        }
    }
    return [result, unit]
}

// Allow the user to configure alert notifications and reminder duration.
// Different to other pages in that data is first saved into local state variables and then propagated to the main vault state
// When the user leaves the page. This is not ideal (two sources of truth) but necessary to be able to use different units
// Without wasting time converting units on every render.
export function UpdatesPage({goNext, goBack, vaultInfo, setVaultInfo}: PageProps) {
    const [durationValue, setDuration] = useState<number>(DEFAULT_DURATION)
    const [durationDisabled, setDurationDisabled] = useState<boolean>(false)
    const [durationUnit, setDurationUnit] = useState<DurationUnit>(DurationUnit.days)

    const [reminderPeriod, setReminderPeriod] = useState<number>(vaultInfo.reminder_period || DEFAULT_REMINDER)
    const [reminderDisabled, setReminderDisabled] = useState<boolean>(vaultInfo.reminder_period === 0)

    // If an existing alert duration is present, covert it.
    // In a use effect, so it does not happen on every render - only when the value changes.
    useEffect(() => {
        if (vaultInfo.alert_duration) {
            const result = secondsToUnits(vaultInfo.alert_duration)

            if (durationValue !== result[0]) {
                setDuration(result[0])
                setDurationUnit(result[1])
                setDurationDisabled(false);
            }
        } else {
            if (vaultInfo.alert_duration === 0) {
                setDurationDisabled(true);
            }
        }
    }, [vaultInfo.alert_duration])

    // When the user navigates away propagate values to vault state.
    function onPageLeft() {
        let durationInSeconds = 0

        // Leave it as 0 if it's disabled
        if (!durationDisabled) {
            if (durationUnit === DurationUnit.minutes) {
                durationInSeconds = durationValue * SECONDS_TO_MINUTES
            } else if (durationUnit === DurationUnit.hours) {
                durationInSeconds = durationValue * SECONDS_TO_MINUTES * MINUTES_TO_HOURS
            } else if (durationUnit === DurationUnit.days) {
                durationInSeconds = durationValue * SECONDS_TO_MINUTES * MINUTES_TO_HOURS * HOURS_TO_DAYS
            } else if (durationUnit === DurationUnit.weeks) {
                durationInSeconds = durationValue * SECONDS_TO_MINUTES * MINUTES_TO_HOURS * HOURS_TO_DAYS * DAYS_TO_WEEKS
            } else {
                throw new Error('Invalid DurationUnit type: ' + durationUnit)
            }
        }

        setVaultInfo({
            reminder_period: reminderDisabled ? 0 : reminderPeriod,
            alert_duration: durationInSeconds
        })
    }

    // Render
    return (
        <PageWrapper>
            <div>
                <PageHeader>Updates & Notifications</PageHeader>
                <SectionHeader>Unlock alert (Recommended)</SectionHeader>
                <p>Would you like to receive an unlock alert when the key pieces are combined, and an unlock attempt is
                    made? <br/>
                    This will give you some time to see the request and accept or deny it. <br/>
                    If you do not respond with the period you set here, your data will be released.
                </p>

                <input
                    type='checkbox' checked={!durationDisabled} className="checkbox"
                    onChange={e => setDurationDisabled(!e.target.checked)}
                /> Receive unlock alerts <br/>
                <input
                    type='checkbox' checked={durationDisabled}
                    onChange={e => setDurationDisabled(e.target.checked)}
                /> No, if key pieces are combined release my
                vault <br/>

                <SectionSubHeader>Unlock time</SectionSubHeader>
                <p>When key pieces are combined and someone tries to unlock my vault, give me</p>
                <input
                    type='number' value={durationValue}
                    onChange={e => setDuration(e.target.value ? parseInt(e.target.value, 10) : 0)}
                    min='1'
                    disabled={durationDisabled}
                />
                <select
                    disabled={durationDisabled} value={durationUnit}
                    onChange={e => setDurationUnit(parseInt(e.target.value, 10))}
                >
                    <option value={DurationUnit.hours}>Hours</option>
                    <option value={DurationUnit.days}>Days</option>
                    <option value={DurationUnit.weeks}>Weeks</option>
                </select>
                {'   '}to respond.

                <SectionHeader>Update reminders</SectionHeader>
                <p>
                    Your vault will be most useful if it is kept up to date with your files, credentials and
                    wishes. <br/>
                    Would you like to receive periodic reminders on when to check your contents?
                </p>

                <input
                    type='checkbox' checked={!reminderDisabled}
                    onChange={e => setReminderDisabled(!e.target.checked)}
                /> Yes, send me an email every so often. <br/>
                <input
                    type='checkbox' checked={reminderDisabled}
                    onChange={e => setReminderDisabled(e.target.checked)}
                /> No, I don't need reminders <br/>

                <SectionSubHeader>Reminder period</SectionSubHeader>
                <p>Send me an email reminder every</p>
                <input
                    type='number' value={reminderPeriod}
                    onChange={e => setReminderPeriod(e.target.value ? parseInt(e.target.value, 10) : 0)}
                    min='1'
                    disabled={reminderDisabled}
                />
                Months
            </div>

            <StandardFooter
                handleContinue={() => {
                    onPageLeft()
                    goNext()
                }} handleBack={() => {
                onPageLeft()
                goBack()
            }}
            />
        </PageWrapper>
    )
}
