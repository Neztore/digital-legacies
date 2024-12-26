export const NAME_MIN = 2
export const NAME_MAX = 50
export const EMAIL_REGEX = /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/

export class ValidationError extends Error {
    constructor(message: string) {
        super(message)
    }
}
