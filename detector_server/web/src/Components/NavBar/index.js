import './index.css'
import {cloneElement, Children, useState, useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';

export function NavBar({children, className = '', onSelection}){
  const [mini, setMini] = useState(false)
  const [path, setPath] = useState(undefined)
  const navigate = (where, deadEnd)=>{
    onSelection(where)
    if(!deadEnd) setPath(where)
  }
  const minimize = ()=>{

  }

  return <nav className={'NavBar ' + className}>
    {Children.map(children, c => {
      return cloneElement(c, {selected: c.props.from === path, navigate});
    })}
  </nav>
}

export function NavSet({children, className='', back, selected, navigate}){
  return <CSSTransition timeout={500} in={selected} unmountOnExit>
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
        return cloneElement(c, {navigate});
      })}
    </ul>
  </CSSTransition>
}

export function NavOption({action = undefined, type, title, icon, navigate}){
  return <li className={'NavOption ' + (action ? 'Action' : '')}>
    <button id={type} onClick={(ev)=>{
      if(action && typeof action === 'function') action()
      navigate(type, action)
    }}>
      <h2>{title}</h2>
      <img className={'Icon SVG ' + icon} alt={icon}/>
    </button>
  </li>
}
