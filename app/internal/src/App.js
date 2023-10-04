import {useEffect, useRef, useState } from 'react';
import { getNetworkList, getNetworkState, getServerUptime, setServerTime, isApiEmulate, requestMockEvent } from './REST';
import {localStorageGetEvents, feed, motion, localStorageClearEvents, localStorageDeleteEvent} from './Helpers'

import './App.css';
import './Theme.css'
import './Res/svg.css'
import NetworkPicker from './Components/NetworkPicker/index';
import { NavBar, NavOption, NavSet } from './Components/NavBar';
import ItemList from './Components/ItemList/index';
import PopUp from './Components/PopUp';

const inDev = process.env.NODE_ENV === 'development'

const catVoiceAlert = (text)=>{
  let msg = new SpeechSynthesisUtterance();
  msg.text = text
  window.speechSynthesis.speak(msg);
}

let address = process.env?.REACT_APP_HW_SERVER_IP
if(!address) address = window.location.hostname


function App() {
  const search = new URLSearchParams(window.location.search);
  const [appStart, setAppStart] = useState(search.get('postupdate') === 'app');
  const [updateInProgress, setUpdateInProgress] = useState();
  const appRef = useRef();

  const [showNetwork, setShowNetwork] = useState(false)
  const [networks, setNetworks] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState('No Network');
  
  const [showFeeding, setShowFeeding] = useState(true)
  const [showFeedingList, setShowFeedingList] = useState(false)
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
        // console.log(diff, dt, now)
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
  
  const onWSMessage = (ev)=>{
    console.log(ev.data)
    const event = JSON.parse(ev.data)

    if(event.type === 'sensor'){
      //voice alert if motion sensor event
      if(event.now == 1){
        catVoiceAlert(sensorMessage)
      }
      //save to log (localstorage)
      motion({now:event.now}, monitorEvents?.[0]?.time, setMonitorEvents)
    }
    if(event.type === 'update'){
      console.log('update in prog...', event?.where);
      setUpdateInProgress(event.where);
    }
    if(event.type === 'refresh' && event?.where === "app_page"){
      setUpdateInProgress(null);
      console.log('Post-update app build upload, should refresh')
      window.location.search = 'postupdate=app';
    }
  }

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
        // console.log(liveWS.current?.readyState)
        if(!liveWS.current || liveWS.current?.readyState === WebSocket.CLOSED) openWS()
        else if(liveWS.current?.readyState === WebSocket.OPEN) liveWS.current?.send('1') //alive signal for server
      }

      if(!isApiEmulate()){
        liveWDT.current = setInterval(()=>{
          doConnection()
        },5000)
        doConnection()
      }
      else
        console.log("emulated api, no WS")
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
    getNetworkList().then(l => setNetworks(l.sort((a,b)=>b.strength - a.strength)))
  }

  useEffect(()=>{
    networkFetch();

    getNetworkState().then(net => {
      setCurrentNetwork(net.ssid);
    }).catch(()=>{
      setCurrentNetwork('No Network')
    })

    if(search.get('postupdate')){
      //clear post update url address no refresh
      const url = new URL(window.location.href)
      url.searchParams.delete('postupdate');
      window.history.replaceState(window.history.state, '', url.href);
    }

  },[])

  const [showNav, setShowNav] = useState(false)

  if(!appStart){
    return <div className='App Intro'>
      <header onClick={()=>{
        if(!inDev) catVoiceAlert('meow, Hello Miki!');
        setAppStart(true);
      }}>
        <p className='Logo'>😻</p>
        <h1>Hello Miki!</h1>
      </header>
      {inDev &&
        <div style={{
          padding: '1rem',
          margin: '1rem',
          borderRadius: '1rem',
          background: 'lightblue',
          color: 'blue'
        }}>
          <h2><i>DEV BUILD</i></h2>
          <h3>{process.env?.REACT_APP_HW_SERVER_IP ? process.env?.REACT_APP_HW_SERVER_IP : 'Emulated API'}</h3>
        </div>
      }
    </div>
  }

  return (
    <div className="App" ref={appRef}>
      <header className="Title" onClick={()=>{setShowNav(n=>!n)}}>
        <div className='Text'>
        <h1>Hello Miki</h1>
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
          
          {/* <NavOption icon={'Cog'} title="Fullscreen" action={()=>{
              appRef.current.requestFullscreen()
          }} />  */}
          <NavOption icon={'Hear'} title="Test Speaker" action={()=>{
            catVoiceAlert('meow')
          }}/>
          {/* <NavOption toSection="time" icon={'Time'} title="Time" /> */}
          <NavOption title={'Update Panel'} action={()=>{
            document.location.href = `http://${document.location.hostname}/device?appVersion=${process.env.REACT_APP_VERSION}`;
          }}/>

          {inDev && <>
            <NavOption title='postupdate' action={()=>{
              const ev = {data: JSON.stringify({type:'refresh',where:'app_page'})};
              onWSMessage(ev)
            }}/>
            <NavOption title='update' action={()=>{
              const ev = {data: JSON.stringify({type:'update',where:'ota'})};
              onWSMessage(ev)
            }}/>
          </>}
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
          {isApiEmulate() && <button onClick={()=>{
            const ev = {data: JSON.stringify(requestMockEvent())};
            onWSMessage(ev)
          }}>
            <img className='Icon SVG CatBlocky'/>
            Trigger Sensor  
          </button>}
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
            {showFeedingList && <NavOption icon={'Time'} title={'Late'} />}
          </NavSet>
        </NavBar>
        <ItemList items={feedingEvents}
        shouldShow={showFeedingList}
        onClick={()=>{setShowFeedingList(s=>!s)}}
        Template={({item, className, isPreview})=>
          <li className={'FeedItemContent ' 
          + className 
          + (isPreview ? ' Preview ' : '')  
          }>
            {isPreview && <div className='Actions'>
              {/* <button><img className='Icon SVG Pen'/>Edit</button> */}
              <button onClick={(ev)=>{
                ev.stopPropagation()
                localStorageDeleteEvent('feed', 'feed'+item.time, setFeedingEvents)
              }}><img className='Icon SVG Bin'/></button>
            </div>}
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
            <div className={'EventBanner Feed ' + (item.amount < 1 ? ' FeedHalf' : '')}>
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

      <PopUp noControl trigger={updateInProgress}>
        <h1>Updating...</h1>
        <h2>[{updateInProgress}]</h2>
      </PopUp>
    </div>
  );
}

export default App;
