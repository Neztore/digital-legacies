// This file is not currently used, but represents an area for expansion - to using SSH2/PGP like keys with comments and comments.
// This functionality was not implemented due to time constraints and difficulty extracting the keys back out of this key format.
const DASHES = " ---- "
const MAIN_KEY_TEXT = "DIGITAL VAULT MAIN KEY"
const KEYSHARE_TEXT = "DIGITAL VAULT KEYSHARE"

const CLOUD_TO_USE = `To use this key, you will need the vault file or an internet connection.`
const OFFLINE_TO_USE = `To use this key, you will need the Digital Legacies application and the vaultfile.`

const MAIN_KEY_EXPLANATION = `This is a key for a digital vault, which contains an individual's personal data.`;
const KEYSHARE_EXPLANATION = `This is a key piece from a digital vault. It is used to access someone's personal data if they die or in other emergency circumstances.
To use it, you need to combine it with other key pieces. These will have been given to other people.`

const getStart = (t: string) => `${DASHES} BEGIN ${t} ${DASHES}`
const getEnd = (t: string) => `${DASHES} END ${t} ${DASHES}`

export const getFullMainKey = (key: string, comment: string, isCloudBacked: boolean) =>
    `${getStart(MAIN_KEY_TEXT)}\n${MAIN_KEY_EXPLANATION}\n${isCloudBacked ? CLOUD_TO_USE : OFFLINE_TO_USE}\nComment: ${comment}\n${key}\n${getEnd(MAIN_KEY_TEXT)}`;

export const getFullKeyshare = (key: string, comment: string, isCloudBacked: boolean) =>
    `${getStart(KEYSHARE_TEXT)}\n${KEYSHARE_EXPLANATION}\n${isCloudBacked ? CLOUD_TO_USE : OFFLINE_TO_USE}\nComment: ${comment}\n${key}\n${getEnd(KEYSHARE_TEXT)}`;


const validStart = /^---- (.*)\w+ ----/
const validEnd = /---- (.*)\w+ ----$/
export const validateKey = (fullKeyText: string): boolean => {
    return validStart.test(fullKeyText) && validEnd.test(fullKeyText)

}

export const extractKey = (_fullKeyText: string): string => {
    return "";
}