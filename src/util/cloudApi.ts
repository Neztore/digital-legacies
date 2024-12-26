// The Cloud API contains networking functions to interface with the cloud provider.
import {CloudKeyData} from "../pages/creation/VaultInfo.tsx";
import {Body, fetch, FetchOptions, Response, ResponseType} from "@tauri-apps/api/http";
import {BACKEND_URL} from "../App.tsx";
import {castErr} from "../shared/Errors.tsx";
import {binaryArrayToString} from "./index.ts";
import {writeBinaryFile} from "@tauri-apps/api/fs";
import {cloudVaultDownloadLoc} from "./fileApi.ts";

const secretToBase64 = (sec: number[]) => btoa(String.fromCharCode(...sec));

/**
 * Upload vault to the cloud provider
 * @param path Path to the vault file.
 * @param creds Cloud credentials (owner cloud key, unloc key)
 * @param reminder Reminder period value
 * @param alert Alert notification value
 * @param name Name of vault owner
 * @param email Email address of vault owner.
 */
export async function uploadVault(path: string, creds: CloudKeyData, reminder: number, alert: number, name: string, email: string): Promise<any> {
    console.log(`Upload with token: ${secretToBase64(creds.share_token)}`);
    const body = Body.form({
        name,
        email_address: email,
        alert_duration: `${alert}`,
        reminder_period: `${reminder}`,
        // Turns binary array into Base 64.
        owner_secret: secretToBase64(creds.owner_token),
        unlock_secret: secretToBase64(creds.share_token),
        vault: {
            file: path,
            mime: 'application/octet-stream',
            fileName: 'data.vault'
        }
    });
    await request(`/vault`, {
        method: "POST",
        body,
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });
}

export interface RequestVaultResponse {
    alert_duration: number,
    name: string,
    email: string,
    open_at?: string
}

/**
 * Requests access given a vault token (first 8 bytes of a key). Returns a number indicating the timestamp at which the vault can be unlocked.
 * This is 0 for vaults with no unlock period that can be immediately downloaded.
 * @param token
 */
export async function requestVault(token: number[]): Promise<RequestVaultResponse> {
    console.log(`Request with token ${secretToBase64(token)}`)
    const res = await request(`/vault`, {
        method: "GET",
        headers: {
            "Authorization": secretToBase64(token)
        }
    });

    if (typeof res.alert_duration === "number") {
        return res;
    } else {
        throw new Error("Failed to request vault. Have you definitely got enough keys, and all of the required participants?");
    }

}

/**
 * Download vault and write it to a binary file. Involves keeping the entire binary vault in memory in JavaScript as an array of numbers.
 * Not fantastic.
 * @param token Token to provide, as an array of bytes.
 */
export async function downloadVault(token: number[]): Promise<string> {
    const res = await request(`/vault/download`, {
        method: "GET",
        headers: {
            "Authorization": secretToBase64(token)
        },
        responseType: ResponseType.Binary
    });

    const path = await cloudVaultDownloadLoc();
    console.log(path)
    await writeBinaryFile(path, res as number[])
    return path;
}

/**
 * Delete vault.
 * @param token Cloud owner token as bytes.
 */
export function deleteVault(token: number[]): Promise<void> {
    return request(`/vault`, {
        method: "DELETE",
        headers: {
            "Authorization": secretToBase64(token)
        }
    });
}

/**
 * HTTP Request helper to make the error handling a bit more hospitable and handle body parsing.
 * @param uri URI to request. Appended to the BACKEND_URL.
 * @param opt Request options.
 */
async function request(uri: string, opt: FetchOptions = {method: "GET"}): Promise<any> {
    // Do parsing ourselves
    if (!opt.responseType) opt.responseType = ResponseType.Text;

    const response: Response<any> = await fetch(`${BACKEND_URL}${uri}`, opt);

    if (response.ok) {
        if (response.data && typeof response.data === "string" && response.data.includes("{")) {
            // It's probably json
            try {
                return JSON.parse(response.data);
            } catch (err) {
                return response.data
            }
        }
        return response.data;

    } else {
        // Error handling. Tries to handle it in a sensible way whether it's empty, a string or json.
        if (!response.data) {
            throw new Error(`Request failed with status ${response.status}. No error given.`)
        }
        // parse binary
        if (opt.responseType === ResponseType.Binary) {
            response.data = binaryArrayToString(response.data);
        }

        let json;
        try {
            json = JSON.parse(response.data);
            console.error(json);
        } catch (err) {
            throw castErr(response.data);
        }

        throw castErr(json);
    }

}