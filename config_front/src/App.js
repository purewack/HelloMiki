import {useEffect, useRef, useState } from 'react';
import { getNetworkList, getLocalPresence } from './REST.mock';

import './App.css';
import NetworkPicker from './Components/NetworkPicker/index';
import './Res/svg.css'
import { CSSTransition } from 'react-transition-group';
import { NavBar, NavOption, NavSet } from './Components/NavBar';
import EventMonitor from './Components/EventMonitor/index';



function App() {

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
    <div className="App">
      <header className="Title">
        <div>
        <h1>Hello-Miki</h1>
        <h2>Version</h2>
        </div>
        <span className='Logo'>😻</span>
        {/* <img src={icon}/> */}
      </header>
      
      <h1>Options</h1>
      <NavBar onSelection={setMode}>
        <NavSet>
          <NavOption type="settings" icon={'Cog'} title="Settings" />
          <NavOption type="logs" icon={'Hear'} title={'Open Log'} action />
          <NavOption type="food" icon={'Food'} title={'Record Feed'} action />
          {/* <Option type="about" Icon={iconAbout} title={'About'} onSelect={select}/> */}
        </NavSet>

        <NavSet from="settings" back>
          <NavOption type="network" icon={'Wifi'} title='Choose Wifi' action={(ev)=>{
            networkFetch()
          }} />
          <NavOption type="sensor" icon={'Cog'} title="Adjust Sensors"/>
          <NavOption type="time" icon={'Time'} title="Set Time"/>
        </NavSet>

        <NavSet from="time" back="settings">
          <NavOption type="fetch" icon={'Cog'} title="Fetch" action/>
        </NavSet>
      </NavBar>
      
      <section className='Content'>
        <hr />
        <CSSTransition unmountOnExit timeout={1000} in={mode === 'network'}>
          <NetworkPicker networks={networks} onRefresh={()=>{
            networkFetch();
          }} /> 
        </CSSTransition>

        <CSSTransition unmountOnExit timeout={1000} in={mode !== 'network'}>
          <EventMonitor monitorEvents={monitorEvents}/>
        </CSSTransition>
      </section>
      
    </div>
  );
}

export default App;
