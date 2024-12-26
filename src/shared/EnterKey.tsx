import {useState} from 'react'
import {KeyFilter, selectFile} from "../util/fileApi.ts";
import {readTextFile} from "@tauri-apps/api/fs";
import {AppError, castErr, ErrorDisplay} from "./Errors.tsx";

export interface EnterKeyProps {
    handleKey: (key: string) => void

}

/**
 * Enter key component. Allows a key to be submitted via. pasting or file. Used for all key submission.
 * @param handleKey Function to handle each individual keys. May be called multiple times in quick succession.
 * @constructor
 */
export function EnterKey({handleKey}: EnterKeyProps) {
    const [text, setText] = useState<string>('')
    const [error, setError] = useState<AppError | undefined>();

    const passKey = (key: string) => {
        if (key && key.trim()) {
            handleKey(key);
        }
    }

    async function _openKeyFromFile() {
        setError(undefined);
        const filePath = await selectFile(false, KeyFilter);
        const keyPromises = filePath.map(p => readTextFile(p));

        const results = await Promise.all(keyPromises)
        for (const s of results) {
            passKey(s);
        }
    }

    const openKeyFromFile = () => _openKeyFromFile().catch(e => setError(castErr(e)));


    return (
        <div>
            <ErrorDisplay error={error}/>
            <div className='field'>
                <label className='label'>Paste key</label>
                <div className='control'>
          <textarea
              className='textarea'
              placeholder='XX:XX:XX:XX:XX'
              value={text} onChange={e => setText(e.target.value)}
              rows={10}
          />
                </div>
            </div>

            <div className='buttons'>
                <button className='button is-success' onClick={() => passKey(text)}>Use key</button>
                <button className="button is-ghost is-small has-text-black">or</button>
                <button className="button" onClick={openKeyFromFile}>Open key from file</button>
            </div>
        </div>
    )
}
