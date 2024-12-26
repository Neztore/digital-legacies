import {PropsWithChildren} from 'react'

export const PageWrapper = ({children}: PropsWithChildren<{}>) => {
    return (
        <div className='section'>
            {children}
        </div>
    )
}


export const PageInner = ({children}: PropsWithChildren<{}>) => {
    return (
        <div className='page-inner'>
            {children}
        </div>
    )
}

// Derived from code I have written previously
// https://github.com/Neztore/save-server/blob/master/server/client/js/shared.js
// Turns a Date into a readable string - used when showing how long until vault data is available.
export function parseTimeUntil(date: Date): string | undefined {
    const diff = (date.getTime() - new Date().getTime()) / 1000;

    if (diff < 0) {
        // It's passed
        return;
    }
    const day_diff = Math.round(diff / 86400);

    return day_diff === 0 && (
            diff < 60 && "Less than a minute" ||
            diff < 120 && "1 minute" ||
            diff < 3600 && Math.floor(diff / 60) + " minutes" ||
            diff < 7200 && "an hour" ||
            diff < 86400 && Math.floor(diff / 3600) + " hours") ||
        day_diff === 1 && "1 day" ||
        day_diff < 7 && day_diff + " days" || Math.round(day_diff / 7) + " weeks";
}

// End Derived code