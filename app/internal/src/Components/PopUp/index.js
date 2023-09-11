import './index.css'
export default function PopUp({children,onExit}){
    return <div className="PopUp">
        {children}
        <button className='ExitButton' onClick={onExit}>X</button>
    </div>
}