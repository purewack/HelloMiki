import {useEffect, useRef, useState } from 'react';
import { getNetworkList, getNetworkState, getPastEvents } from './REST';

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
  const [lastFeedTimeDiff, setLastFeedTimeDiff] = useState();
  const timeDiffTimer = useRef();
  useEffect(()=>{
    if(feedingEvents[0]?.time){
      timeDiffTimer.current = setInterval(()=>{
        const now = new Date();
        setLastFeedTimeDiff()
      })
    }

    return ()=>{
      clearInterval(timeDiffTimer.current)
    }
  },[lastFeedTimeDiff,feedingEvents])
  const feed = (amount)=>{
    setFeedingEvents(f => [{
      time: Date.now(),
      amount
    },
    ...f])
  }
 
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [monitorEvents, setMonitorEvents] = useState([
    // {time: 1694604503436, direction: 'leave'},
    // {time: 1694605505436, direction: 'enter'},
    // {time: 1694606507436, direction: 'waiting'},
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

    getPastEvents().then(ev => {
      setMonitorEvents(ev);
    })
  },[])


  return (
    <div className="App">
      <header className="Title">
        <div>
        <h1>Hello-Miki</h1>
        <h2><i>{currentNetwork}</i></h2>
        </div>
        <span className='Logo'>😻</span>
        {/* <img alt=""  src={icon}/> */}
      </header>
      
      <hr />
      <section className='List Monitor' >
        <div className={'Status' }>
          <img alt=""  className='Icon SVG House'/>
          <img alt=""  className='Icon SVG Garden'/>
        </div> 
        <ItemList onClick={()=>{setShowEventDetails(d=>!d)}}
        template={(item)=> <div className='EventItemContent'>
          <p>{item.time}</p>
          {/* <p>{item.direction}</p> */}
          {item.direction !== 'waiting' ? <div>
            <img alt=""  className='Icon SVG Garden'/>
            <img alt=""  className={'Icon SVG BackArrow ' + (item.direction === 'leave' ? 'RotateFlip' : '')}/>
            <img alt=""  className='Icon SVG Road'/>
          </div> 
          : <div>
            <img alt=""  className={'Icon SVG House'}/>
            <img alt=""  className='Icon SVG Time'/>
          </div>}
          {showEventDetails && <p>{item.direction}</p>}
        </div>}
        
        items={monitorEvents} show={showEventDetails}/>
      </section>
      
      {showFeeding && <section className='List Food' >
        {/* <h1>Food</h1> */}
        <ItemList onClick={()=>{setShowFeedingDetails(d=>!d)}}
        template={(item)=>
          <div className={'FeedItemContent ' + (item.amount < 1 ? 'FeedHalf' : '')}>
            {showFeedingDetails && <p><i>{item.day}</i></p>}
            <p>{item.time}</p>
            <img alt=""  className={'Icon SVG Food'}/>
            {showFeedingDetails && <p>{item.amount < 1 ? 'Half' : 'Whole'}</p>}
          </div>
        } 
        preview = {(item)=> 
          <div className={'FeedItemContentPreview ' + (item.amount < 1 ? 'FeedHalf' : '')}>
            {showFeedingDetails && <p><i>{item.day}</i></p>}
            <p>{item.time}</p>
            {lastFeedTimeDiff && <p>({lastFeedTimeDiff} ago)</p>}
            <img alt=""  className={'Icon SVG Food'}/>
            {showFeedingDetails && <p>{item.amount < 1 ? 'Half' : 'Whole'}</p>}
          </div>
        }
        items={feedingEvents} 
        show={showFeedingDetails}
        />
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
