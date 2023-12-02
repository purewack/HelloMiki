import { useState } from 'react';
import './index.css'
import { CSSTransition } from 'react-transition-group';

export default function ItemList({items, Template, onClickShow, ...restProps}){
    // return 
    const [show, setShow] = useState(false);
    const NoItem = ()=><div className='High Item'>{"Nothing ..."}</div>;

    return <div className={'ItemList ' + (show ? "Show" : '')}  {...restProps}>
      {items.length >= 1 ? (Template ? <Template className='Item High' isPreview={show} item={items[0]} index={0}/> : <NoItem/>) : <NoItem/>}

      {!show && <button onClick={()=>{
        setShow(true)
        onClickShow?.(true)
      }}>...</button>}

      {show && <button onClick={()=>{
        setShow(false)
        onClickShow?.(false)
      }}>Hide Details</button>}

      <CSSTransition unmountOnExit timeout={0} in={show}>
      <ul className='Items'>
        {items.map((e,i) => {
          if(i === 0) return null
          return Template ? 
            <Template  key={`item_${i}`} className='Item' item={e} index={i} isPreview={show}/> 
          : 
            <li className={'Item'} key={`item_${i}`} >{JSON.stringify(e)}</li>
        })}
      </ul>
      </CSSTransition>
    </div> 
}