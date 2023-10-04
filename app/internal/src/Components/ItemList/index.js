import { useState } from 'react';
import './index.css'
import { CSSTransition } from 'react-transition-group';

export default function ItemList({items, Template, shouldShow = undefined, ...restProps}){
    // return 
    const [show, setShow] = useState(shouldShow);
    const NoItem = ()=><div className='High Item'>{"Nothing ..."}</div>;

    const willShow = shouldShow === undefined ? show : shouldShow;

    return <div className='ItemList' onClick={()=>{
      if(shouldShow === undefined)
        setShow(s=>!s)
    }} {...restProps}>

      {items.length >= 1 ? (Template ? <Template className='Item High' isPreview={shouldShow} item={items[0]} index={0}/> : <NoItem/>) : <NoItem/>}

      <CSSTransition unmountOnExit timeout={0} in={willShow}>
      <ul className='Items'>
        {items.map((e,i) => {
          if(i === 0) return null
          return Template ? 
            <Template  key={`item_${i}`} className='Item' item={e} index={i} isPreview={shouldShow}/> 
          : 
            <li className={'Item'} key={`item_${i}`} >{JSON.stringify(e)}</li>
        })}
      </ul>
      </CSSTransition>
    </div> 
}