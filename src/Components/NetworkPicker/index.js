import "./index.css"
import {useState } from "react"
import {CSSTransition} from 'react-transition-group'

export default function NetworkPicker({className = '', networks, onRefresh}){
    const [selection, setSelection] = useState();

    return <div className={'NetworkPicker ' + className} >
      <ul className='Networks'>
        {networks.sort((a,b)=> a.strength < b.strength).map((network,i) => {
          if(network.loading) 
            return <NetworkOption key={`net_load_${i}`}/> 
          else{
            let power
            if(network.strength >= -40) power = "Max"
            else if(network.strength >= -50) power = "High"
            else if(network.strength >= -60) power = "Med" 
            else power = "Low"

            return  <NetworkOption 
              key={`net_${network.ssid}_${network.channel}_${network.strength}`}
              network={{...network, power}} 
              selection={selection} 
              onSelection={ssid=>{setSelection(ssid)}} />
          }
        })}
        <button className='BtnRefresh' onClick={onRefresh}>Refresh</button>  
      </ul> 
    </div>
}

function NetworkOption({network, selection, onSelection}){
  
  if(!network)
    return <li className='Network Loading'>...</li>

  const selected = selection === network.ssid

  return <CSSTransition in={selected} timeout={700} classNames={'net'}>
  <li className={'Network'} 
      onClick={()=>{
        onSelection(network.ssid)
      }}
  >
    <form className="SubmitNetwork" action='/network/select' method='POST'>
      <h2>{network.ssid}</h2>
      <img alt="" className={'Icon SVG Signal StrengthIcon ' + (network.power)}/>
      <input className="SSID" type='text' name='SSID' defaultValue={network.ssid} hidden/>
      <input className="Password" type='password' name='PSK' placeholder="Enter wifi password"/>
      <input className="BtnConnect" type='submit' name='SUBMIT' value='Connect'/>
    </form>
  </li>
  </CSSTransition>
}
