import {useEffect, useRef, useState } from 'react';
import { getNetworkList, getLocalPresence, getNetworkState, getPastEvents } from './REST';

import './App.css';
import NetworkPicker from './Components/NetworkPicker/index';
import './Res/svg.css'
import { CSSTransition } from 'react-transition-group';
import { NavBar, NavOption, NavSet } from './Components/NavBar';
import EventMonitor from './Components/EventMonitor/index';
import PopUp from './Components/PopUp';


const catVoiceAlert = (text)=>{
  let msg = new SpeechSynthesisUtterance();
  msg.text = text
  window.speechSynthesis.speak(msg);
}


function App() {
  const [mode, setMode] = useState('Configure');
  const [networks, setNetworks] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState('No Network');

  const [monitorEvents, setMonitorEvents] = useState([])
  const [liveStatus, setLiveStatus] = useState('close');
  const [liveEvent, setLiveEvent] = useState('');

  useEffect(()=>{
    const ws = new WebSocket(`ws://${window.location.hostname}/ws/monitor`);
    ws.onopen = (ev)=>{
      setLiveStatus('open')
    }
    ws.onclose = (ev)=>{
      setLiveStatus('close')
    }
    ws.onerror = (ev)=>{
      setLiveStatus('error')
    }
    ws.onmessage = (ev)=>{
      // catVoiceAlert();
      setLiveEvent(ev.data)
      const sensors = JSON.parse(ev.data)
      sensors.forEach(d => {
        if(d.sensor_id == 0){
          console.log("motion")
          catVoiceAlert('meow')
        }
        if(d.sensor_id == 1){
          console.log("prox")
          catVoiceAlert('meow meow')
        }
      })
    }

    return ()=>{
      if(ws) ws.close();
    }
  },[])

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
    getNetworkState().then(net => {
      setCurrentNetwork(net.ssid);
    }).catch(()=>{
      setCurrentNetwork('No Network')
    })
  },[])

  useEffect(()=>{
    if(mode === 'logs'){
      getPastEvents().then(ev => {
        setMonitorEvents(ev);
      }).catch(()=>{
        setMonitorEvents([])
      })
    }
  },[mode])

  return (
    <div className="App">
      <header className="Title">
        <div>
        <h1>Hello-Miki</h1>
        <h2>{currentNetwork}</h2>
        </div>
        <span className='Logo'>😻</span>
        {/* <img src={icon}/> */}
      </header>
      
      <h1>Options</h1>
        <hr />
      <NavBar onSelection={setMode}>
        <NavSet>
          <NavOption type="settings" icon={'Cog'} title="Settings" />
          <NavOption type="logs" icon={'Hear'} title={'Log'} action />
          <NavOption type="food" icon={'Food'} title={'Feeding'} />
          {/* <Option type="about" Icon={iconAbout} title={'About'} onSelect={select}/> */}
        </NavSet>

        <NavSet from="food" back>
          <NavOption type="feed_whole" icon={'Food'} title={'Give Whole (1)'} action/>
          <NavOption type="feed_half" icon={'Food'} title={'Give Half (1/2)'} action/>
        </NavSet>

        <NavSet from="settings" back>
          <NavOption type="network" icon={'Wifi'} title='Choose Wifi' action={(ev)=>{
            networkFetch()
          }} />
          {/* <NavOption type="sensor" icon={'Cog'} title="Adjust Sensors"/> */}
          <NavOption type="time" icon={'Time'} title="Set Time" />
        </NavSet>

        <NavSet from="time" back="settings">
          <NavOption type="fetch" icon={'Cog'} title="Use Online time" action/>
          <NavOption type="fetch" icon={'Cog'} title="Use device time" action/>
          <NavOption type="fetch" icon={'Cog'} title="Set Manually" action/>
        </NavSet>
      </NavBar>
      
      <hr />
      <section className='Content'>
        <p>Status:{liveStatus}</p>
        <p>Event:{liveEvent}</p>

        <CSSTransition unmountOnExit timeout={500} in={mode === 'network'}>
          <PopUp onExit={()=>{setMode('')}}>
          <NetworkPicker networks={networks} onRefresh={()=>{
            networkFetch();
          }} /> 
          </PopUp>
        </CSSTransition>

        <CSSTransition unmountOnExit timeout={1000} in={mode === 'logs'}>
          <EventMonitor monitorEvents={monitorEvents} />
        </CSSTransition>
      </section>
      
    </div>
  );
}

export default App;
