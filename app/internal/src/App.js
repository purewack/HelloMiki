import {createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getNetworkList, getNetworkState, getServerUptime, setServerTime, isApiEmulate, requestMockEvent } from './REST';
import {localStorageGetKeys, motion, localStorageClearKeys, localStorageDeleteKeys, arm, timestampToMinutesSinceMidnight, isDaytime} from './Helpers'

import './App.css';
import './App.Dark.css';
import './Theme.css'
import './Res/svg.css'
import NetworkPicker from './Components/NetworkPicker';
import { NavBar, NavOption, NavSet } from './Components/NavBar';
import PopUp from './Components/PopUp';
import FeedingPanel from './PanelFeeding';
import MotionPanel from './PanelMotion';

export const inDev = process.env?.NODE_ENV === 'development'

export let address = process.env?.REACT_APP_HW_SERVER_IP || window.location.hostname 

export const TimeContext = createContext();

let speaker = new SpeechSynthesisUtterance();
export const catVoiceAlert = (text)=>{
  speaker.text = text
  window.speechSynthesis.speak(speaker);
}

function App() {
  const search = new URLSearchParams(window.location.search);
  const [appStart, setAppStart] = useState(search.get('postupdate') === 'app');
  // const [updateInProgress, setUpdateInProgress] = useState();

  const [showNetwork, setShowNetwork] = useState(false)
  const [networks, setNetworks] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState('No Network');
  
  const [currentTime, setCurrentTime] = useState(Date.now());
  const timer = useRef();
  useEffect(()=>{
    if(timer.current) clearInterval(timer.current);
    timer.current = setInterval(()=>{
      setCurrentTime(Date.now());
    },1000 * 60);

    return ()=>{
      clearInterval(timer.current);
      timer.current = null;
    }
  },[])
  

  const [darkModeTimed, setDarkModeTimed] = useState(false);
  const [darkModeForced, setDarkModeForced] = useState(JSON.parse(localStorage.getItem('darkModeForced')));
  useEffect(()=>{
    localStorage.setItem('darkModeForced', darkModeForced ? 'true':'false')
  },[darkModeForced])
  useEffect(()=>{
    const daytime = isDaytime(currentTime);
    setDarkModeTimed(d => !daytime);
  },[currentTime, setDarkModeTimed])
  const darkClass = (darkModeTimed || darkModeForced ? ' Dark ' : '');


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

  const [liveStatus, setLiveStatus] = useState(true);
  const [panels, setPanels] = useState({feeding:true, motion: true});

  if(!appStart){
    return <div className={'App Intro ' + darkClass}>
      <header onClick={()=>{
        if(!inDev) catVoiceAlert('meow, Hello Meekee!');
        setAppStart(true);
      }}>
        <p className='Logo'><img className='Icon SVG Logo'/></p>
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
  <TimeContext.Provider value={currentTime}>
    <div className={"App " + darkClass}>

      <header className="Title" onClick={()=>{setShowNav(n=>!n)}}>
        <div className='Text'>
        <h1>Hello Miki</h1>
        <h3><i>{currentNetwork}</i></h3>
        </div>
        <span className={'Logo Main ' + (liveStatus && 'Live')}>
          <img className='Icon SVG Logo'/>
        </span>
      </header> 

      
      {showNav && <>
      <NavBar >
        <NavSet >
          <NavOption icon={'BackArrow'} title={'Back'} action={()=>{setShowNav(false)}} />
          <NavOption icon={'Wifi'} title='Choose Wifi' action={(ev)=>{
            networkFetch()
            setShowNetwork(true);
          }} />

          <NavOption icon={'CatBlocky'} title='Toggle Motion' action={()=>{setPanels({...panels, motion: !panels.motion})}} />
          <NavOption icon={'Food'} title='Toggle Feeding' action={()=>{setPanels({...panels, feeding: !panels.feeding})}} />
          
          {/* <NavOption icon={'Bin'} title={'Clear Feeding'} action={()=>{
            setFeedingEvents([])
            localStorageClearKeys('feed')
          }}/>
          <NavOption icon={'Bin'} title={'Clear Events'} action={()=>{
            setMonitorEvents([])
            localStorageClearKeys('motion')
          }}/> */}
          
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
            {/* <NavOption title='postupdate' action={()=>{
              const ev = {data: JSON.stringify({type:'refresh',where:'app_page'})};
              onWSMessage(ev)
            }}/>
            <NavOption title='update' action={()=>{
              const ev = {data: JSON.stringify({type:'update',where:'ota'})};
              onWSMessage(ev)
            }}/> */}
            
            {/* <NavOption icon={'Power'} title="Toggle Production View" action={()=>{
              setShouldProductionView(s => !s);
            }}/> */}
          </>}
        </NavSet>
      </NavBar>
      <hr />
      </>}
      
      {panels.motion && <MotionPanel onLiveStateChange={(s)=>{setLiveStatus(s)}}/>}

      {panels.feeding && <FeedingPanel />}
        
      <PopUp onExit={()=>{setShowNetwork(false)}} trigger={showNetwork}>
        <NetworkPicker networks={networks} onRefresh={()=>{
          networkFetch();
        }} /> 
      </PopUp>
      
      {/* <PopUp noControl trigger={updateInProgress}>
        <h1>Updating...</h1>
        <h2>[{updateInProgress}]</h2>
      </PopUp> */}
    </div>
  </TimeContext.Provider>
  );
}

export default App;
