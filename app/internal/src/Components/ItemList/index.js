import './index.css'
import { CSSTransition } from 'react-transition-group';

export default function ItemList({items, template, show, ...restProps}){
    // return 
    return <div className='ItemList' {...restProps}>

      <div className='High Item'>{
      items[0] ? 
        (template ? template(items[0],0) :JSON.stringify(items[0]))
        : "Nothing ..."
      }</div>
      
      <CSSTransition unmountOnExit timeout={1000} in={show}>
      <ul className='Items'>
        {items.map((e,i) => {
          if(i === 0) return null
          return <li className={'Item'} key={`item_${i}`} >{template ? template(e,i) : JSON.stringify(e)}</li>
        })}
      </ul>
     </CSSTransition>
    </div> 
}