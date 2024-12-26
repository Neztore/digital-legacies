// Some useful utility functions for keys.
const HEX = 16
export const MASTER_KEY_LENGTH = 32;

export function byteArrayToKeyString(byteArray: number[]) {
    return byteArray.map(i => i.toString(HEX)).join(':')
}

export function displayKey(byteArray: number[]) {
    return byteArrayToKeyString(byteArray).substring(0, 10)
}

export function keyStringToByteArray(str: string) {
    return str.split(':').map(i => parseInt(i, HEX))
}

export function binaryArrayToString(arr: number[]) {
    return arr.map((r: number) => String.fromCharCode(r)).join("");
}