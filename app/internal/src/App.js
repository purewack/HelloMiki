import {useEffect, useRef, useState } from 'react';
import { getNetworkList, getNetworkState, getPastEvents, setSensorArmState, setTime } from './REST';

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
  const [appStart, setAppStart] = useState(false);
  const appRef = useRef();

  const [showNetwork, setShowNetwork] = useState(false)
  const [networks, setNetworks] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState('No Network');
  
  const timeStampEvent = (ev)=>{
    return {
      ...ev,
      timeHuman: new Date(ev.time).toLocaleTimeString(),
      dateHuman: new Date(ev.time).toLocaleDateString(),
    }
  }

  const [showFeeding, setShowFeeding] = useState(true)
  const [feedingEvents, setFeedingEvents] = useState([])
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

  const feed = (amount)=>{
    const now = Date.now();
    const ee = timeStampEvent({
      time: now,
      amount
    })

    const hnow = new Date();
    const hlast = new Date(feedingEvents?.[0]?.time)
    const hdelta = hnow.getHours() - hlast.getHours();
    console.log(hnow, hlast, hdelta)

    if(hdelta < 0){
      console.log('clear')
      localStorage.clear()
      setFeedingEvents([ee])
    }else
      setFeedingEvents(f => [ee,...f])
    localStorage.setItem('feed'+now,JSON.stringify(ee));
  }  
  useEffect(()=>{
    let evs = [...Array(localStorage.length)];
    evs = evs.map((_,i)=>{
      const k = localStorage.key(i)
      if(k.startsWith('feed')){
        return JSON.parse(localStorage.getItem(k))
      }
      return null
    })
    .filter((v,i) => v !== null)
    .sort((a,b) => b.time - a.time)
    setFeedingEvents(evs);
  },[])
  
  const [sensorMessage, setSensorMessage] = useState('Meow Meow');
  const [monitorEvents, setMonitorEvents] = useState([])
  const [liveStatus, setLiveStatus] = useState('wait');
  const liveEvent = useRef();
  const [sensorsArmed, setSensorsArmed] = useState(true);
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
      if(!ev.wasClean){
        liveEvent.current.timer = setTimeout(()=>{
          console.log('connect retry')
          openWS()
        },1000)
      }
    }
    const onWSError = (ev)=>{
      console.log(ev)
      setLiveStatus('error')
      // liveEvent.current.timer = setTimeout(()=>{
      //   console.log('connect retry')
      //   openWS()
      // },1000)
    }
    const onWSMessage = (ev)=>{
      console.log(ev.data)
      const event = JSON.parse(ev.data)

      //voice alert if motion sensor event
      if(event.now == 1){
        catVoiceAlert(sensorMessage)
      }

      //save to log
      setMonitorEvents(e => [timeStampEvent(event), ...e])
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

    if(sensorsArmed)
    openWS()

    return ()=>{
      closeWS()
      if(liveEvent.current?.timer) clearTimeout(liveEvent.current.timer)
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

    getPastEvents().then(ev => {
      setMonitorEvents(ev.map(e=>timeStampEvent(e)));
    })
  },[])

  const [showNav, setShowNav] = useState(false)

  if(!appStart){
    return <div className='App Intro'>
      <header onClick={()=>{
        catVoiceAlert('meow, Hello Miki!');
        setAppStart(true);
        setTime(Date.now());
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
      
      {showNav &&
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
            localStorage.clear();
          }}/>
          <NavOption icon={'Bin'} title={'Clear Events'} action={()=>{
            setMonitorEvents([])
          }}/>
          
          <NavOption icon={'Cog'} title="Fullscreen" action={()=>{
              appRef.current.requestFullscreen()
          }} /> 
          <NavOption icon={'Hear'} title="Test Alert" action={()=>{
            catVoiceAlert('meow')
          }}/>
          <NavOption toSection="time" icon={'Time'} title="Time" />
        </NavSet>

        <NavSet section="time" back>        
          <NavOption icon={'Wifi'} title="Use Online time" autoReturn/>
          <NavOption icon={'Time'} title="Use device time" autoReturn action={()=>{
            console.log(Date.now())
            setTime(Date.now());
          }}/>
          <NavOption icon={'Cog'} title="Set time manually" />    
        </NavSet>
      </NavBar>
      }
      
      <hr />
      
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
            <NavOption icon={'Food'} title={'1'}   action={()=>{feed(1)}}/>
            <NavOption icon={'Food'} title={'1/2'} action={()=>{feed(0.5)}} className='FeedHalf' />
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
