import './index.css'

export default function PopUp({children,onExit,trigger,noControl, className = ''}){
    if(!trigger) return null;
    return (
        <div className={"PopUp " + className}>
            {children}
            {!noControl && <button className='ExitButton' onClick={onExit}>X</button>}
        </div>
    )
}