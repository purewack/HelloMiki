import {useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getNetworkList, getNetworkState, getServerUptime, setServerTime, isApiEmulate, requestMockEvent } from './REST';
import {localStorageGetEvents, feed, motion, localStorageClearEvents, localStorageDeleteEvent, arm, timestampToMinutesSinceMidnight, isDaytime} from './Helpers'

import './App.css';
import './App.Dark.css';
import './Theme.css'
import './Res/svg.css'
import NetworkPicker from './Components/NetworkPicker';
import { NavBar, NavOption, NavSet } from './Components/NavBar';
import ItemList from './Components/ItemList';
import PopUp from './Components/PopUp';
import Timeline from './Components/Timeline';

const inDev = process.env?.NODE_ENV === 'development'

const catVoiceAlert = (text)=>{
  let msg = new SpeechSynthesisUtterance();
  msg.text = text
  window.speechSynthesis.speak(msg);
}

let address = process.env?.REACT_APP_HW_SERVER_IP
if(!address) address = window.location.hostname


function App() {
  const [shouldProductionView, setShouldProductionView] = useState(inDev)
  const productionMode = isApiEmulate() && !shouldProductionView ;

  const search = new URLSearchParams(window.location.search);
  const [appStart, setAppStart] = useState(search.get('postupdate') === 'app');
  const [updateInProgress, setUpdateInProgress] = useState();

  const [showNetwork, setShowNetwork] = useState(false)
  const [networks, setNetworks] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState('No Network');
  
  const [showFeeding, setShowFeeding] = useState(true)
  const [showFeedingList, setShowFeedingList] = useState(false)
  const [showFeedingLate, setShowFeedingLate] = useState(false)
  const [feedingEvents, setFeedingEvents] = useState([])
  const feedLateRef = useRef();
  
  //feeding time difference since last one
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [lastFeedTimeDiff, setLastFeedTimeDiff] = useState();
  const timeDiffTimer = useRef();
  useEffect(()=>{
    if(feedingEvents[0]?.time){
      const newTime = ()=>{
        const now = new Date();
        setCurrentTime(Date.now());
        const dt = new Date(now - feedingEvents[0].time);
        const diff = dt.getHours()-1 + 'h ' + dt.getMinutes() + 'min'
        // console.log(diff, dt, now)
        setLastFeedTimeDiff(diff)
      }
      newTime()
      timeDiffTimer.current = setInterval(newTime,1000 * 60 )
    }
    else
      setLastFeedTimeDiff(null)

    return ()=>{
      clearInterval(timeDiffTimer.current)
    }
  },[feedingEvents])

  const feedAmount = (amount)=>{
    feed(amount, feedingEvents?.[0]?.time, setFeedingEvents)
    // catVoiceAlert('yummy')
  }
  const feedAmountLate = (amount)=>{
    const t = feedLateRef.current.value.split(':');
    const d = new Date();
    d.setHours(t[0])
    d.setMinutes(t[1])
    const late = d.valueOf()
    if(late > Date.now()) {
      return
    }
    setShowFeedingLate(false);
    feed(amount, feedingEvents?.[0]?.time, setFeedingEvents, late);
    // catVoiceAlert('that was yummy')
  }


  useEffect(()=>{
    localStorageGetEvents('feed',setFeedingEvents)
  },[])
  
  const [monitorEvents, setMonitorEvents] = useState([])
  const [sensorMessage, setSensorMessage] = useState('Meow Meow');
  const [sensorsArmed, setSensorsArmed] = useState(true);
  const [liveStatus, setLiveStatus] = useState('wait');
  // const [sensorsArmedEvents, setSensorsArmedEvents] = useState([])
  
  // useEffect(()=>{ 
  //   arm({armed:sensorsArmed},undefined,setSensorsArmedEvents);
  // },[sensorsArmed]);

  // useEffect(()=>{
  //   const date = new Date(currentTime);
  //   if(date.getHours() === 0 && date.getMinutes()<5) {
  //     localStorageClearEvents('arm');
  //     arm({armed:sensorsArmed},undefined,setSensorsArmedEvents);
  //   }
  // },[currentTime,sensorsArmed])

  useEffect(()=>{
    // localStorageGetEvents('arm',setSensorsArmedEvents);
    localStorageGetEvents('motion',setMonitorEvents)
  },[])


  //WebSockets for live monitor events
  const liveWS = useRef()
  const liveWDT = useRef()
  
  const onWSMessage = useCallback((ev)=>{
    if(!ev) return
    console.log(ev.data)
    const event = JSON.parse(ev.data)

    if(event.type === 'sensor'){
      //voice alert if motion sensor event
      if(event.now === 1){
        if(sensorsArmed) catVoiceAlert(sensorMessage)
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
  },[sensorMessage, sensorsArmed])

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
      ws.onerror   = onWSError;
      ws.onclose   = onWSClose;
      ws.onopen    = onWSOpen;
      liveWS.current = ws;
      setServerTime(Date.now());
    }

    // if(sensorsArmed){
      const doConnection = ()=>{
        // console.log(liveWS.current?.readyState)
        if(!liveWS.current || liveWS.current?.readyState === WebSocket.CLOSED) openWS()
        else if(liveWS.current?.readyState === WebSocket.OPEN) liveWS.current?.send('1') //alive signal for server
      }

      if(!isApiEmulate()){
        liveWDT.current = setInterval(()=>{
          doConnection()
        },60000)
        doConnection()
      }
      else
        console.log("emulated api, no WS")
    // }

    return ()=>{
      if(liveWS.current?.readyState === WebSocket.OPEN){
        liveWS.current.close()
        console.log("closing WS", liveWS.current)
      }

      clearInterval(liveWDT?.current)
    }
  },[])

  useEffect(()=>{
    if(onWSMessage && liveWS?.current){
      console.log('new arm state', sensorsArmed)
      liveWS.current.onmessage = onWSMessage;
    }
  },[onWSMessage])
  
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

  const [darkModeTimed, setDarkModeTimed] = useState(false);
  const [darkModeForced, setDarkModeForced] = useState(JSON.parse(localStorage.getItem('darkMode')));
  useEffect(()=>{
    localStorage.setItem('darkMode', darkModeForced ? 'true':'false')
  },[darkModeForced])
  useEffect(()=>{
    const daytime = isDaytime(currentTime);
    setDarkModeTimed(d => !daytime);
  },[currentTime, setDarkModeTimed])
  const darkClass = (darkModeTimed || darkModeForced ? ' Dark ' : '');

  useEffect(()=>{
    console.log('NIGHT' ,darkModeTimed)
  },[darkModeTimed])

  if(!appStart){
    return <div className={'App Intro ' + darkClass}>
      <header onClick={()=>{
        if(!inDev) catVoiceAlert('meow, Hello Meekee!');
        setAppStart(true);
      }}>
        <p className='Logo'>😻</p>
        <div>
        <h1>Hello Miki!</h1>
        <i>Click to open monitor</i>
        </div>
      </header>
      <h6>{process.env.REACT_APP_VERSION}</h6>
      {inDev &&
        <div style={{
          padding: '1rem',
          margin: '1rem',
          border: 'solid lightgray 1px',
          borderRadius: '1rem',
          background: 'honeydew',
          color: 'lightblue'
        }}>
          <h2><i>DEV BUILD</i></h2>
          <h3>{process.env?.REACT_APP_HW_SERVER_IP ? process.env?.REACT_APP_HW_SERVER_IP : 'Emulated API'}</h3>
        </div>
      }
    </div>
  }

  return (
    <div className={"App " + darkClass}>
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
          
          <NavOption icon={'Power'} title={darkModeForced ? "Dark Mode: On" : "Dark Mode: Auto"} action={()=>{
            setDarkModeForced(d => !d);
          }}/>

          <NavOption icon={'Hear'} title="Test Speaker" action={()=>{
            catVoiceAlert('meow')
          }}/>
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
            
            <NavOption icon={'Power'} title="Toggle Production View" action={()=>{
              setShouldProductionView(s => !s);
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
      
      
      <section className={'List Monitor ' + (sensorsArmed ? 'Arm' : 'Disarm')} >
        <div className={'LiveStatus '}>
          
          <Timeline className={'Card MotionTimeline'} 
            nowTime={currentTime}
            timestamps={monitorEvents.map(e => e.time)} 
            // armTimestamps={sensorsArmedEvents.map(e => e.time)}
            // timestamps={[1702531585000, 1702538785000, 1702556785000, 1702558705000, 1702559425000, 1702584625000, 1702591225000, 1702593924336]}
            // armTimestamps={[1702548025000, 1702556425000, 1702579225000, 1702593625000]}
            // initialArmState={monitorEvents?.[0]?.armed}
            
          />
          
          
          {inDev && !productionMode && <button onClick={()=>{
            const ev = {data: JSON.stringify(requestMockEvent())};
            onWSMessage(ev)
          }}>
            <img alt='cat' className='Icon SVG CatBlocky'/>
            Trigger Sensor  
          </button>}
          
        </div> 

        <ItemList items={monitorEvents}
        Template={({item, className, isPreview, index})=>
          <div className={'EventItemContent ' + className }>
              <div className='EventTimeBanner'>
                {monitorEvents?.length ? <>
                <p className='EventTime'>{item.timeHuman}</p>
                <p className='EventDay'>{item.dateHuman}</p>
                </>
                :
                <p>Nothing to show yet</p>
                }
              </div> 

              {(index === 0 && !isPreview) ? 

              <button onClick={()=>{
                setSensorsArmed(s=>!s)
              }}>
                <img alt='power' className={'Icon SVG Power'} />
                Mute
              </button> 
              
              : 

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
                </>}
              </div>
              }
          </div> 
        }/>

      </section>
      

      {showFeeding && <>
  
      <section className='List Food' >
        {/* <h1>Food</h1>  */}

        <NavBar className='Controls'>
          <NavSet>
              <NavOption icon={'Time'} title={'Late'} action={()=>{setShowFeedingLate(true)}}/>
              <NavOption icon={'Food'} title={'Snack'} action={()=>{feedAmount(0.1)}} className='FeedSnack' />
              <NavOption icon={'Food'} title={'1/2'} action={()=>{feedAmount(0.5)}} className='FeedHalf' />
              <NavOption icon={'Food'} title={'1'}   action={()=>{feedAmount(1)}}/>
          </NavSet>
        </NavBar>

        <ItemList items={feedingEvents}
        onClickShow={(willShow)=>{setShowFeedingList(willShow)}}
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
              }}><img alt='bin' className='Icon SVG Bin'/></button>
            </div>}
            <div className={'EventTimeBanner'}>
              {isPreview ? <>
                <p className='EventTime'>{item.timeHuman}</p>
                <p className='EventDay'>{item.dateHuman}</p>
              </>
              :
              <>
                <p className='EventTimeDelta'>{lastFeedTimeDiff}</p>
                <p className='EventTimeSub'>{item.timeHuman}</p>
              </>}
            </div>
            <div className={'EventBanner Feed ' + (item.amount > 0.5 ? '' : item.amount > 0.1 ? 'FeedHalf' : 'FeedSnack')}>
            <img alt=""  className={'Icon SVG Food'}/>
            {isPreview && <p>{item.amount > 0.5 ? 'Whole' : item.amount > 0.1 ? 'Half' : 'Snack'}</p>}
            </div>
            
          </li>
        }  
        />

        <Timeline className={'Card FeedingTimeline'} 
          nowTime={currentTime}
          timestamps={feedingEvents.map(e => e.time)} 
        />
        

      </section>
      </>}
        
      <PopUp onExit={()=>{setShowNetwork(false)}} trigger={showNetwork}>
        <NetworkPicker networks={networks} onRefresh={()=>{
          networkFetch();
        }} /> 
      </PopUp>
      
      <PopUp className="FeedLate" trigger={showFeedingLate} onExit={()=>{setShowFeedingLate(false)}}>
        <h1>When?</h1>
        <form onSubmit={(e)=>{
          e.preventDefault()
        }}>
          <button onClick={()=>{feedAmountLate(1)}}>
            <img alt='food' className='Icon SVG Food'/>
            Full
          </button>
          <button onClick={()=>{feedAmountLate(0.5)}} className='FeedHalf'>
            <img alt='food' className='Icon SVG Food'/>
            Half
          </button>
          <button onClick={()=>{feedAmountLate(0.1)}} className='FeedSnack'>
            <img alt='food' className='Icon SVG Food'/>
            Snack
          </button>
          <input ref={feedLateRef} type="time" id="appt" name="appt" defaultValue="12:00" />
        </form>
      </PopUp>

      <PopUp noControl trigger={updateInProgress}>
        <h1>Updating...</h1>
        <h2>[{updateInProgress}]</h2>
      </PopUp>
    </div>
  );
}

export default App;
