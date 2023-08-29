import { useEffect, useRef, useState } from 'react';
import { getNetworkList, getStatus } from './REST.mock';

import './App.css';
// import iconCat from './Res/cat-svgrepo-com.svg'
import iconSignal from './Res/signal-strong-svgrepo-com.svg'
import iconWifi from './Res/wifi-svgrepo-com.svg'
import iconAbout from './Res/question-svgrepo-com.svg'
import iconMonitor from './Res/ear-3-svgrepo-com.svg'

function Option({onSelect, onActivated, type, title, icon, children}){
  const [active, setActive] = useState(false);
  
  return <li id={type} className={'Option Card ' + (active ? 'active' : '')} onClick={(ev)=>{
    if(!active){
      setActive(true)
      onSelect?.(ev)
      onActivated?.()
    }
  }}>
    <h2>{title}</h2>
    {active ? <>
      {children}
      <button className='Button' onClick={()=>{
        setActive(false)
        onSelect?.({target:{id:null}})
      }}>Back</button>
    </> : <img src={icon}/>}
    
  </li>
}


function App() {

  const appRef = useRef();

  const [status, setStatus] = useState('...');
  const [mode, setMode] = useState('');
  const [networks, setNetworks] = useState();

  const select = (ev)=>{
    setMode(ev.target.id);
  }

  // useEffect(()=>{
  //   getStatus().then(r=> {
  //     setStatus(r.connected ? "" : "Not " + "Connected")
  //   })
  // }, [])
  
  useEffect(()=>{
    console.log(mode)
  },[mode]);

  const networkFetch = ()=>{
    setNetworks([
      {loading: true},
      {loading: true},
      {loading: true},
      {loading: true},
      {loading: true},
      {loading: true},
    ]);
    getNetworkList().then(l => setNetworks(l))
  }

  return (
    <div className="App" ref={appRef}>
      <header className="Title">
        <div>
        <h1>Hello-Miki</h1>
        <h2>Configuration</h2>
        </div>
        <span className='Logo'>😻</span>
        {/* <img src={icon}/> */}
      </header>

      <section className='Content'>
        <ul className={'ContentContainer ' + (mode ? ' Selected' : '')}>
          <Option type="network" icon={iconWifi} onSelect={networkFetch} 
            title="Pick your WiFi">
          {
            networks && <>
              <ul className='Networks'>
                {networks.map((network,i) => {
                  if(network.loading) 
                    return <li className='Selection Card Loading' key={
                      `net_load_${i}`
                    }>...</li>
                  else{
                    let strength
                    if(network.strength >= -40) strength = "Max"
                    else if(network.strength >= -50) strength = "High"
                    else if(network.strength >= -60) strength = "Med" 
                    else strength = "Low"
                    return <li className={'Selection Card '} key={
                      `net_${network.ssid}_${network.channel}_${network.strength}`
                    }>
                      <span>{network.ssid}</span>
                      <img src={iconSignal} className={'StrengthIcon ' + (strength)}/>
                    </li>
                  }
                })}
              </ul>
              <button className='Button Refresh' onClick={networkFetch}>Refresh</button>
              </>
          }
          </Option>
          <Option type="monitor" icon={iconMonitor} title={'Open Monitor'} onSelect={select}/>
          <Option type="about" icon={iconAbout} title={'About'} onSelect={select}/>
          {/* <Option type="fullscreen" title={'Fullsceen'} onSelect={()=>{
            appRef.current.requestFullscreen()
          }}/> */}
        </ul>
      </section>

      {/* <nav className='Nav'>
        <h2>Status: {status}</h2>
      </nav> */}

    </div>
  );
}

export default App;
