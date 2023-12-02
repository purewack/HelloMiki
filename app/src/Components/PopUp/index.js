import './index.css'
import { CSSTransition } from 'react-transition-group';

export default function PopUp({children,onExit,trigger,noControl, className = ''}){
    return <CSSTransition unmountOnExit timeout={500} in={trigger}>
        <div className={"PopUp " + className}>
            {children}
            {!noControl && <button className='ExitButton' onClick={onExit}>X</button>}
        </div>
    </CSSTransition>    
}