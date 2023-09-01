import { useEffect, useRef, useState } from 'react';
import { getNetworkList, getLocalPresence } from './REST.mock';

import './App.css';
import NetworkPicker from './Components/NetworkPicker/index';
import './Res/svg.css'

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
    </> : <img className={'Icon SVG ' + icon} />}
    
  </li>
}



function App() {

  const appRef = useRef();

  const [status, setStatus] = useState('...');
  const [mode, setMode] = useState('Configure');
  const [networks, setNetworks] = useState([]);

  const [monitorEvents, setMonitorEvents] = useState([])
  const [monitorFreq, setMonitorFreq] = useState(1000);
  const monitorTimer = useRef();


  // useEffect(()=>{
  //   monitorTimer.current = setInterval(()=>{
  //     getLocalPresence().then(r=>{
  //       if(r.direction) {
  //         catVoiceAlert();
  //         setMonitorEvents(v => {
  //           return [...v, {...r, time: new Date().toUTCString()}];
  //         })
  //       }
  //     })
  //   },monitorFreq)

  //   return ()=>{
  //     clearInterval(monitorTimer.current);
  //   }
  // })


  const select = (ev)=>{
    setMode(ev.target.id);
  }

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

  useEffect(()=>{
    networkFetch();
  },[])

  return (
    <div className="App" ref={appRef}>
      <header className="Title">
        <div>
        <h1>Hello-Miki</h1>
        <h2>{mode}</h2>
        </div>
        <span className='Logo'>😻</span>
        {/* <img src={icon}/> */}
      </header>
      
      <NetworkPicker networks={networks} onRefresh={()=>{
        networkFetch();
      }} />
      
      <nav className='Options'>
        <ul className={'ContentContainer '}>
          {/* <Option type="network" icon={iconWifi} onSelect={(ev)=>{
            networkFetch()
            select(ev)
          }} 
            title="Pick your WiFi">
          </Option> */}
          <Option type="monitor" icon={'Hear'} title={'Open Monitor'} onSelect={select}/>
          {/* <Option type="about" Icon={iconAbout} title={'About'} onSelect={select}/> */}
        </ul>
      </nav>

      {/* <section className='Content'>
        <ul className={'ContentContainer '}>
          <Option type="network" icon={iconWifi} onSelect={(ev)=>{
            networkFetch()
            select(ev)
          }} 
            title="Pick your WiFi">
          {
          </Option>
          <Option type="monitor" icon={iconMonitor} title={'Open Monitor'} onSelect={select}/>
          <Option type="about" icon={iconAbout} title={'About'} onSelect={select}/>
         
        </ul>
      </section> */}

      {/* <nav className='Nav'>
        <h2>Status: {status}</h2>
      </nav> */}

    </div>
  );
}

export default App;
