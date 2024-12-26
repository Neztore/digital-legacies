import {UnlockPageProps} from "./index.tsx";
import {PageInner, PageWrapper, parseTimeUntil} from "../../shared";
import {PageHeader, SectionHeader} from "../../shared/Headers.tsx";
import {Footer, FooterButton, StandardFooter} from "../../shared/Footer.tsx";
import {useState} from "react";
import {AppError, castErr, ErrorDisplay} from "../../shared/Errors.tsx";
import {downloadVault, requestVault, RequestVaultResponse} from "../../util/cloudApi.ts";
import {invoke} from "@tauri-apps/api";
import {keyStringToByteArray} from "../../util";
import {isPermissionGranted, requestPermission, sendNotification} from "@tauri-apps/api/notification";


export function Initiate({goNext, goBack, vaultInfo: {keys}, setVaultInfo}: UnlockPageProps) {
    const [resp, setResp] = useState<RequestVaultResponse | undefined>();
    const [error, setError] = useState<AppError | undefined>();
    const [token, setToken] = useState<number[]>([])

    function startDownload(tok?: number[]) {
        (async function () {
            const hasNotifyPerm = await isPermissionGranted();
            if (hasNotifyPerm) {
                sendNotification({
                    body: `The open timer for the vault has now expired, and you can access its contents.`,
                    title: "Vault ready for access.",
                    sound: "default"
                });
            }

            const path = await downloadVault(tok || token);

            // @ts-ignore
            setVaultInfo({vaultInfo: {path}})
            goNext();
        })().catch(e => setError(castErr(e)));
    }

    function makeRequest() {
        setError(undefined);
        (async function () {
            const token = await invoke("unlock_cloud", {
                keys: (keys || []).map(k => keyStringToByteArray(k))
            });
            const res = await requestVault(token as number[]);
            setToken(token as number[]);
            setResp(res);

            if (res.alert_duration === 0 || parseInt(res.open_at || "") < new Date().getTime()) {
                // Move onto next stage - download
                startDownload(token as number[])
            } else {
                setTimeout(startDownload, parseInt(res.open_at || "", 10))

                // Try to get notification permission
                const hasPerm = await isPermissionGranted();
                if (!hasPerm) {
                    await requestPermission();

                }
            }

        })().catch(e => setError(castErr(e)));
    }


    if (resp == undefined) {
        return <PageWrapper>
            <PageInner>
                <PageHeader>Initiate unlock </PageHeader>
                <SectionHeader>Would you like to begin unlocking the data?</SectionHeader>

                <ErrorDisplay error={error}/>
                <p>
                    If the vault is configured to send a unlock notification, clicking proceed will trigger the
                    notification to be sent.
                </p>
                <p>
                    If no period is configured, the vault will start downloading. This action cannot be reversed, but
                    does not affect the copy stored in the cloud.
                </p>


            </PageInner>

            <StandardFooter handleContinue={makeRequest} handleBack={goBack}/>

        </PageWrapper>
    } else {
        const unlockTime = new Date(parseInt(resp.open_at || "", 10));
        const timeStr = parseTimeUntil(unlockTime);
        const inPast = unlockTime.getTime() < new Date().getTime();

        if (inPast) {
            return <PageWrapper>
                <PageInner>
                    <PageHeader>Unlock period complete</PageHeader>
                    <SectionHeader>Vault unlocked: Downloading contents</SectionHeader>
                    <ErrorDisplay error={error}/>
                    <p>
                        The vault is now downloading. Please wait - do not leave this page.
                    </p>

                </PageInner>

                <Footer>
                    <FooterButton handleClick={goBack}/>
                </Footer>

            </PageWrapper>
        }

        return <PageWrapper>
            <PageInner>
                <PageHeader>Unlock period started</PageHeader>
                <SectionHeader>Time left to wait: {timeStr}</SectionHeader>
                <ErrorDisplay error={error}/>
                <p>
                    This vault has a notification period enabled. You will get access in {timeStr}.
                </p>
                <p>
                    To get access sooner, you can ask the vault owner to approve the prompt if they are able.<br/>
                    Otherwise, there is no way to make this process shorter.
                </p>
                <br/>
                <p>
                    You can close this application and come back later, but you will need the key pieces again. Keep
                    them safe.<br/>
                    Vault will be ready at <time className="has-text-weight-bold"
                                                 dateTime={unlockTime.toISOString()}>{unlockTime.toLocaleString()}.</time>
                </p>

            </PageInner>

            <Footer>
                <FooterButton handleClick={goBack}/>
            </Footer>

        </PageWrapper>


    }
}