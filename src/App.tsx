// Josh Muir - Securing Digital Legacies - March 2024.
import {useEffect, useState} from 'react'
import './App.css'
import {Welcome} from './pages/welcome.tsx'
import {CreateVault} from './pages/creation'
import './assets/app.scss'
import {UnlockVault} from './pages/unlock'
import {Open} from './pages/open'
import {PublicVaultInfo} from './pages/unlock/Unlockinfo.tsx'
import {VaultInfo} from './pages/creation/VaultInfo.tsx'
import {invoke} from "@tauri-apps/api";

// Use my personal backend server
// Unfortunately this is necessary as the school blocks SMTP traffic on port 587 (as most providers do).
export const BACKEND_URL = "https://legacies.josh.scot"

export enum Purpose {
    welcome,
    create,
    open,
    unlock
}

// I would rather not have this here, but it needs to be passed down
// Combining the two cuts out an extra re-render and makes sure it is cleared when changing purpose
interface PurposeState {
    purpose: Purpose
    toOpen?: PublicVaultInfo | VaultInfo
}

function App() {
    const [{purpose, toOpen}, setPurpose] = useState<PurposeState>({purpose: Purpose.welcome})


    // Called once. removes splash/loading screen.
    useEffect(() => {
        invoke('close_splashscreen').catch(console.error)
    }, []);

    if (purpose === Purpose.welcome) {
        return (
            <Welcome
                setPurpose={p => setPurpose({purpose: p})}
                handleSelect={(v) => setPurpose({purpose: Purpose.open, toOpen: v})}
            />
        )
    } else if (purpose === Purpose.create) {
        return <CreateVault initialVault={toOpen as VaultInfo}/>
    } else if (purpose === Purpose.open) {
        return (
            <Open
                toOpen={toOpen as PublicVaultInfo | undefined}
                handleCancel={() => setPurpose({purpose: Purpose.welcome})}
                handleUnlock={() => setPurpose({purpose: Purpose.unlock})}
                handleOpened={(v: VaultInfo) => setPurpose({purpose: Purpose.create, toOpen: v})}
            />
        )
    } else if (purpose === Purpose.unlock) {
        return <UnlockVault/>
    }

    throw new Error('Invalid state')
}

export default App
