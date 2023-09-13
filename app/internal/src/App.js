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
  const [monitorEvents, setMonitorEvents] = useState([])
  const [presence, setPresence] = useState('home');
  const [liveStatus, setLiveStatus] = useState('wait');
  const timeStampEvent = (ev)=>{
    return {
      ...ev,
      timeHuman: new Date(ev.time).toLocaleString(),
    }
  }

  const liveEvent = useRef();
  const [liveEventData, setLiveEventData] = useState()
  useEffect(()=>{

    let openWS;
    const onWSOpen = (ev)=>{
      console.log(ev)
      setLiveStatus('open')
      liveEvent.current.timer = undefined
    }
    const onWSClose = (ev)=>{
      console.log(ev)
      setLiveStatus('close')
    }
    const onWSError = (ev)=>{
      console.log(ev)
      setLiveStatus('error')
      liveEvent.current.timer = setTimeout(()=>{
        console.log('connect retry')
        openWS()
      },1000)
    }
    const onWSMessage = (ev)=>{
      console.log(ev.data)
      const event = JSON.parse(ev.data)
      setLiveEventData(ev.data)

      //voice alert if motion sensor event
      if(event.type == 0 && event.location == 1){
        catVoiceAlert('meow')
      }

      //save to log
      setMonitorEvents(e => [event, ...e])
    }

    openWS = ()=>{
      let address = process.env?.REACT_APP_HW_SERVER_IP
      if(!address) address = window.location.hostname
      const ws = new WebSocket(`ws://${address}/ws/monitor`);
      ws.onmessage = onWSMessage;
      ws.onerror   = onWSError;
      ws.onclose   = onWSClose;
      ws.onopen    = onWSOpen;
      liveEvent.current = {ws}
    }
    const closeWS = ()=>{
      if(liveEvent.current?.ws) liveEvent.current.ws.close()
    }

    openWS()

    return ()=>{
      closeWS()
      if(liveEvent.current?.timer) clearTimeout(liveEvent.current.timer)
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

    getPastEvents().then(ev => {
      setMonitorEvents(ev);
    })
  },[])

  const [showNav, setShowNav] = useState(false)
  return (
    <div className="App">
      {!showNav ? <header className="Title" onClick={()=>{setShowNav(true)}}>
        <div>
        <h1>Hello-Miki</h1>
        <h2><i>{currentNetwork}</i></h2>
        </div>
        <span className='Logo'>😻</span>
        {/* <img alt=""  src={icon}/> */}
      </header> 
      
      : 
      
      <NavBar >
        <NavSet >
          <NavOption icon={'BackArrow'} title={'Back'} action={()=>{setShowNav(false)}} />
          <NavOption icon={'Wifi'} title='Choose Wifi' action={(ev)=>{
            networkFetch()
            setShowNetwork(true);
          }} />
          <NavOption icon={'Food'} title='Toggle Feeding' action={()=>{setShowFeeding(f=>!f)}} />
          <NavOption icon={'BackArrow'} title={'Clear Feeding'} />
          <NavOption toSection="time" icon={'Time'} title="Other" />
        </NavSet>

        <NavSet section="time" back>
          <NavOption icon={'Wifi'} title="Use Online time" autoReturn/>
          <NavOption icon={'Time'} title="Use device time" autoReturn/>
          <NavOption icon={'Cog'} title="Set time manually" />
          <NavOption icon={'Hear'} title="Test Alert" action={()=>{
            catVoiceAlert('meow')
          }}/>
        </NavSet>
      </NavBar>
      }
      
      <hr />
      <section className='List Monitor' >
        <div className={'Status' }>
          <img alt=""  className='Icon SVG House'/>
          <img alt=""  className='Icon SVG Garden'/>
        </div> 
        <ItemList onClick={()=>{setShowEventDetails(d=>!d)}}
        template={(item)=> <div className='EventItemContent'>
          <p>{JSON.stringify(item)}</p>
          {/* <p>{item.time}</p>
          {item.direction !== 'waiting' ? <div>
            <img alt=""  className='Icon SVG Garden'/>
            <img alt=""  className={'Icon SVG BackArrow ' + (item.direction === 'leave' ? 'RotateFlip' : '')}/>
            <img alt=""  className='Icon SVG Road'/>
          </div> 
          : <div>
            <img alt=""  className={'Icon SVG House'}/>
            <img alt=""  className='Icon SVG Time'/>
          </div>}
          {showEventDetails && <p>{item.direction}</p>} */}
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
        // preview = {(item)=> 
        //   <div className={'FeedItemContentPreview ' + (item.amount < 1 ? 'FeedHalf' : '')}>
        //     {showFeedingDetails && <p><i>{item.day}</i></p>}
        //     <p>{item.time}</p>
        //     {lastFeedTimeDiff && <p>({lastFeedTimeDiff} ago)</p>}
        //     <img alt=""  className={'Icon SVG Food'}/>
        //     {showFeedingDetails && <p>{item.amount < 1 ? 'Half' : 'Whole'}</p>}
        //   </div>
        // }
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

      
      <PopUp onExit={()=>{setShowNetwork(false)}} trigger={showNetwork}>
        <NetworkPicker networks={networks} onRefresh={()=>{
          networkFetch();
        }} /> 
      </PopUp>
    </div>
  );
}

export default App;
