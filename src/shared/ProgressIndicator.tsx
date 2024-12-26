export interface ProgressIndicatorProps {
    stages: string[]
    disabled?: number[]
    activeStage: number
}

/**
 * Progress indicator at the top of the page.
 * @param stages Strings to display for each stage.
 * @param activeStage Index of the stage that is currently open.
 * @param disabled Array of disabled pages to be shown in grey
 * @constructor
 */
export const ProgressIndicator = ({stages, activeStage, disabled = []}: ProgressIndicatorProps) => {
    if (stages.length === 0) {
        return <p>Empty Progress indicator</p>
    }

    const elements = []
    for (let index = 0; index < stages.length; index++) {
        const stage = stages[index]
        const isDisabled = disabled.includes(index)
        const isActive = index === activeStage
        const key = `${stage}-${index}-progress`

        elements.push(<ProgressItem
            isActive={isActive}
            isDisabled={isDisabled}
            no={index + 1}
            stage={stage}
            key={key}
        />)
    }

    return (
        <div style={{display: 'flex', width: '100%', justifyContent: 'space-evenly'}}>
            {elements}
        </div>
    )
}

interface ProgressItemProps {
    isActive: boolean
    isDisabled: boolean
    no: number
    stage: string
}

function ProgressItem({isActive, isDisabled, no, stage}: ProgressItemProps) {
    return (
        <div className={`progress-item ${isActive ? 'is-active' : isDisabled ? 'is-disabled' : ''}`}>
            <div className='top'/>
            <p>{no}: {stage}</p>
        </div>
    )
}
