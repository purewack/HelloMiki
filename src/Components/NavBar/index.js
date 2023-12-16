import './index.css'
import {cloneElement, Children, useState } from 'react';
import { CSSTransition } from 'react-transition-group';

export function NavBar({children, className = '', onSection}){
  const [path, setPath] = useState(undefined)
  const navigate = (where)=>{
    setPath(where)
    if(onSection) onSection(where)
  }

  return <nav className={'NavBar ' + className}>
    {Children.map(children, c => {
      return cloneElement(c, {selected: c.props.section === path, navigate});
    })}
  </nav>
}

export function NavSet({children, className='', back, selected, navigate, onAction}){
  return <CSSTransition timeout={0} in={selected} unmountOnExit>
    <ul className={'NavSet ' + className}>
      
      {back && <li className={'NavOption Back'}>
        <button onClick={()=>{
          const where = back?.length ? back : undefined
          navigate(where, false)
        }}>
          <img className={'Icon SVG BackArrow' } alt={'<-'}/>
        </button>
      </li>}

      {Children.map(children, c => {
        if(c)
        return cloneElement(c, {navigate});
      })}
    </ul>
  </CSSTransition>
}

export function NavOption({
  action = undefined, 
  toSection = undefined, 
  autoReturn = undefined,
  navigate,
  title, icon, 
  minor = undefined,
  className="", 
}){

  return <li className={'NavOption ' + (!toSection ? 'Action ' : '')  + className}>
    <button onClick={(ev)=>{
      if(action){
        if(typeof action === 'function') action()
      }
      if(toSection) navigate(toSection)
      if(autoReturn) navigate()
    }}>
      <h2>{title}</h2>
      {icon && <img className={'Icon SVG ' + icon} alt={icon}/>}
    </button>
  </li>
}
