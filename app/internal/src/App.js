import {useEffect, useRef, useState } from 'react';
import { getNetworkList, getLocalPresence, getNetworkState, getPastEvents } from './REST';

import './App.css';
import './Theme.css'
import './Res/svg.css'
import NetworkPicker from './Components/NetworkPicker/index';
import { NavBar, NavOption, NavSet } from './Components/NavBar';
import ItemList from './Components/ItemList/index';
import PopUp from './Components/PopUp';


const catVoiceAlert = (text)=>{
  let msg = new SpeechSynthesisUtterance();
  msg.text = text
  window.speechSynthesis.speak(msg);
}


function App() {
  const [showNetwork, setShowNetwork] = useState(false)
  const [networks, setNetworks] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState('No Network');
  
  const [showFeeding, setShowFeeding] = useState(false)
  const [showFeedingDetails, setShowFeedingDetails] = useState(false)
  const [feedingEvents, setFeedingEvents] = useState([
    // {time: '2022-09-12 12:23:00', amount: 0.5},
    // {time: '2022-09-12 19:10:00', amount: 1},
  ])
  const feed = (amount)=>{
    const d = new Date()
    setFeedingEvents(f => [{
      time: d.toLocaleTimeString(),
      day: d.toLocaleDateString(),
      amount
    },
    ...f])
  }
 
  const [showEventDetails, setShowDetails] = useState(false)
  const [monitorEvents, setMonitorEvents] = useState([
    {time: '12:30:00', day:"2023/09/13", direction: 'leave'},
    {time: '19:00:00', day:"2023/09/13", direction: 'enter'},
    {time: '19:04:00', day:"2023/09/13", direction: 'waiting'},
  ])
  const [liveStatus, setLiveStatus] = useState('wait');
  const [liveEvent, setLiveEvent] = useState('');

  // useEffect(()=>{
  //   const ws = new WebSocket(`ws://${window.location.hostname}/ws/monitor`);
  //   ws.onopen = (ev)=>{
  //     console.log(ev)
  //     setLiveStatus('open')
  //   }
  //   ws.onclose = (ev)=>{
  //     console.log(ev)
  //     setLiveStatus('close')
  //   }
  //   ws.onerror = (ev)=>{
  //     console.log(ev)
  //     setLiveStatus('error')
  //   }
  //   ws.onmessage = (ev)=>{
  //     // catVoiceAlert();
  //     setLiveEvent(ev.data)
  //     const sensors = JSON.parse(ev.data)
  //     sensors.forEach(d => {
  //       if(d.sensor_id == 0){
  //         console.log("motion")
  //         catVoiceAlert('meow')
  //       }
  //       if(d.sensor_id == 1){
  //         console.log("prox")
  //         catVoiceAlert('meow meow')
  //       }
  //     })
  //   }

  //   return ()=>{
  //     if(ws) ws.close();
  //   }
  // },[])

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

  // useEffect(()=>{
  //   if(mode === 'logs'){
  //     getPastEvents().then(ev => {
  //       setMonitorEvents(ev);
  //     }).catch(()=>{
  //       setMonitorEvents([])
  //     })
  //   }
  // },[mode])

  return (
    <div className="App">
      <header className="Title">
        <div>
        <h1>Hello-Miki</h1>
        <h2><i>{currentNetwork}</i></h2>
        </div>
        <span className='Logo'>😻</span>
        {/* <img src={icon}/> */}
      </header>
      
      <hr />
      <section className='List Monitor' >
        <div className='Status'>
          <img className='Icon SVG Hear'/>
          <div className={'StatusIndicator ' + liveStatus}></div>
        </div> 
        {/* <p>{liveStatus} Event:{liveEvent}</p> */}
        <ItemList onClick={()=>{setShowDetails(d=>!d)}}
        template={(item)=> <div className='EventItem'>
          <p>{item.time}</p>
          <p>{item.direction}</p>
          {item.direction !== 'waiting' ? <>
            <img className='Icon SVG Garden'/>
            <img className={'Icon SVG BackArrow ' + (item.direction === 'leave' ? 'RotateFlip' : '')}/>
            <img className='Icon SVG Road'/>
          </> 
          : <>
            <img className={'Icon SVG House'}/>
            <img className='Icon SVG Time'/>
          </>
          }
        </div>} items={monitorEvents} show={showEventDetails}/>
      </section>
      
      {showFeeding && <section className='List Food' >
        {/* <h1>Food</h1> */}
        <ItemList onClick={()=>{setShowFeedingDetails(d=>!d)}}
        template={(item)=>{
          return <div className={'FeedItem ' + (item.amount < 1 ? 'FeedHalf' : '')}>
            <p>{item.time}</p>
            <p><i>{item.day}</i></p>
            <img className={'Icon SVG Food'}/>
          </div>
        }} items={feedingEvents} show={showFeedingDetails}/>
        <NavBar>
          <NavSet>
            <NavOption icon={'Food'} title={'1'}   action={()=>{feed(1)}}/>
            <NavOption icon={'Food'} title={'1/2'} action={()=>{feed(0.5)}} className='FeedHalf' />
          </NavSet>
        </NavBar>
      </section>}
        
      <hr />

      <NavBar >
        <NavSet >
          <NavOption icon={'Wifi'} title='Choose Wifi' action={(ev)=>{
            networkFetch()
            setShowNetwork(true);
          }} />
          <NavOption icon={'Food'} title='Toggle Feeding' action={()=>{setShowFeeding(f=>!f)}} />
          <NavOption icon={'BackArrow'} title={'Clear Feeding'} />
          <NavOption toSection="time" icon={'Time'} title="Set Time" />
          <NavOption icon={'Hear'} title="Test Alert" action={()=>{
            catVoiceAlert('meow')
          }}/>
        </NavSet>

        <NavSet section="time" back>
          <NavOption icon={'Wifi'} title="Use Online time" autoReturn/>
          <NavOption icon={'Time'} title="Use device time" autoReturn/>
          <NavOption icon={'Cog'} title="Set Manually" />
        </NavSet>
      </NavBar>
      
      <PopUp onExit={()=>{setShowNetwork(false)}} trigger={showNetwork}>
        <NetworkPicker networks={networks} onRefresh={()=>{
          networkFetch();
        }} /> 
      </PopUp>
    </div>
  );
}

export default App;
