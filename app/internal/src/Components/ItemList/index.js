import { useState } from 'react';
import './index.css'

export default function ItemList({items, Template, onClickShow, ...restProps}){
    // return 
    const [show, setShow] = useState(false);
    const NoItem = ()=><div className='Item'>{"Nothing ..."}</div>;

    return <div className={'ItemList ' + (show ? "Show" : '')}  {...restProps}>
      
      {!show && <button onClick={()=>{
        setShow(true)
        onClickShow?.(true)
      }}>...</button>}

      {show && <button onClick={()=>{
        setShow(false)
        onClickShow?.(false)
      }}>Hide Details</button>}

      {items.length >= 1 ? (!show && Template ? <Template className='Item High' isPreview={false} item={items[0]} index={0}/> : null) : <NoItem/>}

      {show && items.length >= 1 && <ul className='Items'>
        {items.map((e,i) => {
          return Template ? 
            <Template  key={`item_${i}`} className='Item' item={e} index={i} isPreview={true}/> 
          : 
            <li className={'Item'} key={`item_${i}`} >{JSON.stringify(e)}</li>
        })}
      </ul>}
    </div> 
}