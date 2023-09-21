import {useEffect, useRef, useState } from 'react';
import { getNetworkList, getNetworkState, getServerUptime, setServerTime } from './REST';
import {localStorageGetEvents, feed, motion, localStorageClearEvents} from './Helpers'

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

let address = process.env?.REACT_APP_HW_SERVER_IP
if(!address) address = window.location.hostname

function App() {
  const [appStart, setAppStart] = useState(false);
  const appRef = useRef();

  const [showNetwork, setShowNetwork] = useState(false)
  const [networks, setNetworks] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState('No Network');
  
  const [showFeeding, setShowFeeding] = useState(true)
  const [feedingEvents, setFeedingEvents] = useState([])
  
  //feeding time difference since last one
  const [lastFeedTimeDiff, setLastFeedTimeDiff] = useState();
  const timeDiffTimer = useRef();
  useEffect(()=>{
    if(feedingEvents[0]?.time){
      const newTime = ()=>{
        const now = new Date();
        const dt = new Date(now - feedingEvents[0].time);
        const diff = dt.getHours()-1 + 'h ' + dt.getMinutes() + 'min'
        console.log(diff, dt, now)
        setLastFeedTimeDiff(diff)
      }
      newTime()
      timeDiffTimer.current = setInterval(newTime,1000 * 60)
    }
    else
      setLastFeedTimeDiff(null)

    return ()=>{
      clearInterval(timeDiffTimer.current)
    }
  },[feedingEvents])

  const feedAmount = (amount)=>{
    feed(amount, feedingEvents?.[0]?.time, setFeedingEvents)
  }


  useEffect(()=>{
    localStorageGetEvents('feed',setFeedingEvents)
  },[])
  
  const [monitorEvents, setMonitorEvents] = useState([])
  const [sensorMessage, setSensorMessage] = useState('Meow Meow');
  const [sensorsArmed, setSensorsArmed] = useState(true);
  const [liveStatus, setLiveStatus] = useState('wait');
 
  //WebSockets for live monitor events
  const liveWS = useRef()
  const [liveUptime, setLiveUptime] = useState(null)
  const liveWDT = useRef()
  useEffect(()=>{

    let openWS;
    const onWSOpen = (ev)=>{
      console.log(ev)
      setLiveStatus('open')
      localStorageGetEvents('motion',setMonitorEvents)
    }
    const onWSClose = (ev)=>{
      console.log(ev)
      setLiveStatus('close')
    }
    const onWSError = (ev)=>{
      console.log(ev)
      setLiveStatus('error')
    }
    const onWSMessage = (ev)=>{
      console.log(ev.data)
      const event = JSON.parse(ev.data)

      //voice alert if motion sensor event
      if(event.now == 1){
        catVoiceAlert(sensorMessage)
      }
      //save to log (localstorage)
      motion({now:event.now}, monitorEvents?.[0]?.time, setMonitorEvents)
    }

    openWS = ()=>{
      const st = liveWS.current?.readyState
      if(st === WebSocket.OPEN 
      || st === WebSocket.CONNECTING ) return
      const ws = new WebSocket(`ws://${address}/ws/monitor`);
      ws.onmessage = onWSMessage;
      ws.onerror   = onWSError;
      ws.onclose   = onWSClose;
      ws.onopen    = onWSOpen;
      liveWS.current = ws;
      setServerTime(Date.now());
    }

    if(sensorsArmed){
      const doConnection = ()=>{
        console.log(liveWS.current?.readyState)
        if(!liveWS.current || liveWS.current?.readyState === WebSocket.CLOSED) openWS()
        else if(liveWS.current?.readyState === WebSocket.OPEN) liveWS.current?.send('alive')
      }
      liveWDT.current = setInterval(()=>{
        doConnection()
      },5000)
      doConnection()
    }

    return ()=>{
      if(liveWS.current?.readyState === WebSocket.OPEN){
        liveWS.current.close()
        console.log("closing WS", liveWS.current)
      }

      clearInterval(liveWDT?.current)
    }
  },[sensorsArmed])

  
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

  const [showNav, setShowNav] = useState(false)

  if(!appStart){
    return <div className='App Intro'>
      <header onClick={()=>{
        catVoiceAlert('meow, Hello Miki!');
        setAppStart(true);
      }}>
        <p className='Logo'>😻</p>
        <h1>Hello Miki!</h1>
      </header>
      <h2 className='Version'>v1.1</h2>
    </div>
  }

  return (
    <div className="App" ref={appRef}>
      <header className="Title" onClick={()=>{setShowNav(n=>!n)}}>
        <div className='Text'>
        <h1>Hello-Miki</h1>
        <h3><i>{currentNetwork}</i></h3>
        </div>
        <span className={'Logo Main ' + liveStatus}>😻</span>
        {/* <img alt=""  src={icon}/> */}
      </header> 
      
      {showNav && <>
      <NavBar >
        <NavSet >
          <NavOption icon={'BackArrow'} title={'Back'} action={()=>{setShowNav(false)}} />
          <NavOption icon={'Wifi'} title='Choose Wifi' action={(ev)=>{
            networkFetch()
            setShowNetwork(true);
          }} />
          <NavOption icon={'Food'} title='Toggle Feeding' action={()=>{setShowFeeding(f=>!f)}} />
         
          <NavOption icon={'Bin'} title={'Clear Feeding'} action={()=>{
            setFeedingEvents([])
            localStorageClearEvents('feed')
          }}/>
          <NavOption icon={'Bin'} title={'Clear Events'} action={()=>{
            setMonitorEvents([])
            localStorageClearEvents('motion')
          }}/>
          
          <NavOption icon={'Cog'} title="Fullscreen" action={()=>{
              appRef.current.requestFullscreen()
          }} /> 
          <NavOption icon={'Hear'} title="Test Alert" action={()=>{
            catVoiceAlert('meow')
          }}/>
          {/* <NavOption toSection="time" icon={'Time'} title="Time" /> */}
        </NavSet>

        {/* <NavSet section="time" back>        
          <NavOption icon={'Wifi'} title="Use Online time" autoReturn/>
          <NavOption icon={'Time'} title="Use device time" autoReturn action={()=>{
            console.log(Date.now())
            setTime(Date.now());
          }}/>
          <NavOption icon={'Cog'} title="Set time manually" />    
        </NavSet> */}
      </NavBar>
      <hr />
      </>}
      
      
      <section className={'List Monitor '} >
        <div className={'LiveStatus ' + (sensorsArmed ? 'Arm' : 'Disarm')}>
          {/* <div className='Locations'>
            <img alt=""  className='Icon SVG Road'/>
            <img alt=""  className='Icon SVG Garden'/>
          </div> */}
          <button onClick={()=>{
            setSensorsArmed(s=>!s)
          }}>
            <img className={'Icon SVG Power'} />
            Arm
          </button>
        </div> 
        <ItemList items={monitorEvents}
        Template={({item, className, isPreview})=> 
        <div className={'EventItemContent ' + className}>
          <div className='EventTimeBanner'>
            <p className='EventTime'>{item.timeHuman}</p>
            <p className='EventDay'>{item.dateHuman}</p>
          </div>
          <div className='EventBanner'>{item.now === 1 && item.prev === 2 ? 
          <>
            <img alt=""  className='Icon SVG Road'/>
            <img alt=""  className={'Icon SVG BackArrow RotateFlip'}/>
            <img alt=""  className='Icon SVG Garden'/>
          </>
          : item.now === 2 && item.prev === 1 ? 
          <>
            <img alt=""  className='Icon SVG Road'/>
            <img alt=""  className={'Icon SVG BackArrow'}/>
            <img alt=""  className='Icon SVG Garden'/>
          </> 
          :
          <>
            <img alt=""  className={'Icon SVG House'}/>
            <img alt=""  className='Icon SVG Time'/>
          </>
          }</div>
        </div>}/>
      </section>
      

      {showFeeding && <>
      <hr />
      <section className='List Food' >
        {/* <h1>Food</h1>  */}
        <NavBar>
          <NavSet>
            <NavOption icon={'Food'} title={'1'}   action={()=>{feedAmount(1)}}/>
            <NavOption icon={'Food'} title={'1/2'} action={()=>{feedAmount(0.5)}} className='FeedHalf' />
          </NavSet>
        </NavBar>
        <ItemList items={feedingEvents}
        Template={({item, className, isPreview})=>
          <li className={'FeedItemContent ' + className + (item.amount < 1 ? ' FeedHalf' : '')}>
            <div className={'EventTimeBanner'}>
              {isPreview ? <>
                <p className='EventTime'>{item.timeHuman}</p>
                <p className='EventDay'>{item.dateHuman}</p>
              </>
              :
              <>
                <p className='EventTimeDelta'>{lastFeedTimeDiff + ' ago'}</p>
                <p className='EventTimeSub'>{item.timeHuman}</p>
              </>}
            </div>
            <div className='EventBanner Feed'>
            <img alt=""  className={'Icon SVG Food'}/>
            {isPreview && <p>{item.amount < 1 ? 'Half' : 'Whole'}</p>}
            </div>
            
          </li>
        }  
        />
      </section>
      </>}
        
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
