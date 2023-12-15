import { useCallback, useContext, useEffect, useReducer, useRef, useState } from "react";
import { TimeContext, address, catVoiceAlert, inDev } from "./App";
import { isApiEmulate, requestMockEvent, setServerTime } from "./REST";
import { localStorageGetKeys, localStoragePurgeOldKeys, localStorageSetKeys, localStorageTimestampSet } from "./Helpers";
import Timeline from "./Components/Timeline";
import ItemList from "./Components/ItemList";

function useMotionWebSocket(sensorsArmed, callback, injectMockEvent = undefined){
    const liveWS = useRef(null)
    const liveWDT = useRef(null)
  
    const onWSMessage = useCallback((ev)=>{
        if(!ev) return
        console.log(ev.data)
        const event = JSON.parse(ev.data)

        if(event.type === 'sensor'){
            callback('motion',{now:event.now})
        }

        //UPDATE FUNCTION Removed for now
        // if(event.type === 'update'){
        //     console.log('update in prog...', event?.where);
        //     setUpdateInProgress(event.where);
        // }
        // if(event.type === 'refresh' && event?.where === "app_page"){
        //     setUpdateInProgress(null);
        //     console.log('Post-update app build upload, should refresh')
        //     window.location.search = 'postupdate=app';
        // }  
    },[sensorsArmed])

    useEffect(()=>{
        if(onWSMessage && liveWS?.current){
            console.log('new arm state', sensorsArmed)
            liveWS.current.onmessage = onWSMessage;
        }
    },[onWSMessage])

    useEffect(()=>{

        let openWS;
        const onWSOpen = (ev)=>{
            console.log(ev)
            callback('open')
        }
        const onWSClose = (ev)=>{
            console.log(ev)
            callback('close')
        }
        const onWSError = (ev)=>{
            console.log(ev)
            callback('error')
        }

        openWS = ()=>{
            const st = liveWS.current?.readyState
            if(st === WebSocket.OPEN || st === WebSocket.CONNECTING ) return
            
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

    return onWSMessage
}

export function useMotionPanelLogic(currentTime){
    
    const [events, setEvents] = useState([]);
    const [armed, setArmed] = useState(true);
    
    const wsPostMessage = useMotionWebSocket(armed,(type,data)=>{
        switch(type){
            case 'motion':
                if(data.now === 1){
                    if(armed) catVoiceAlert('meow meow')
                }
                localStoragePurgeOldKeys('motion',setEvents);
                localStorageTimestampSet('motion',data,setEvents);
            break;

            case 'open':
                dispatch({type:'live',state:true});
                // localStoragePurgeOldKeys('motion',setEvents);
                // localStorageGetKeys('motion',setEvents)
            break;

            case 'close':
            case 'error':
                dispatch({type:'live',state:false});
            break;
        }
    })

    const [currentState, dispatch] = useReducer((state, action)=>{
        switch(action.type){
            case 'live':
                return {...state, live: action.state}
            break;

            case 'arm_toggle':
                setArmed(!state.armed);
                return {...state, armed: !state.armed}
            break;

            case 'mock_event':
                wsPostMessage(action.event);
                return {...state}
            break;
        }
        return {...state}
    },{
        armed: true,
        live: false,
    })

    useEffect(()=>{
        // localStorageGetEvents('arm',setSensorsArmedEvents);
        localStoragePurgeOldKeys('motion',setEvents);
        localStorageGetKeys('motion',setEvents);
    },[])

    return [currentState, dispatch, events]
}

export default function MotionPanel({onLiveStateChange}){

    const currentTime = useContext(TimeContext);
    const [state, dispatch, events] = useMotionPanelLogic(currentTime);
    
    useEffect(()=>{
        // console.log(state.armed)
        onLiveStateChange?.(state.armed)
    },[state.armed, onLiveStateChange])

    return (
        <section className={'List Monitor ' + (state.armed ? 'Arm' : 'Disarm')} >
            
            <div className={'LiveStatus '}>
            
            <Timeline className={'Card MotionTimeline'} 
                nowTime={currentTime}
                timestamps={events.map(e => e.time)} 
                // armTimestamps={sensorsArmedEvents.map(e => e.time)}
                // timestamps={[1702531585000, 1702538785000, 1702556785000, 1702558705000, 1702559425000, 1702584625000, 1702591225000, 1702593924336]}
                // armTimestamps={[1702548025000, 1702556425000, 1702579225000, 1702593625000]}
                // initialArmState={monitorEvents?.[0]?.armed}
                
            />
            
            {inDev && <button onClick={()=>{
                const ev = {data: JSON.stringify(requestMockEvent())};
                dispatch({type:'mock_event',event:ev});
            }}>
                <img alt='cat' className='Icon SVG CatBlocky'/>
                Trigger Sensor  
            </button>}
            
            </div> 

            <ItemList items={events}
            Template={({item, className, isPreview, index})=>
                <div className={'EventItemContent ' + className }>
                    <div className='EventTimeBanner'>
                        {events?.length ? <>
                        <p className='EventTime'>{item.timeHuman}</p>
                        <p className='EventDay'>{item.dateHuman}</p>
                        </>
                        :
                        <p>Nothing to show yet</p>
                        }
                    </div> 

                    {(index === 0 && !isPreview) ? 

                    <button onClick={()=>{
                        dispatch({type:'arm_toggle'});
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
                        {/* <img alt=""  className={'Icon SVG House'}/> */}
                        <img alt=""  className='Icon SVG Time'/>
                        </>}
                    </div>
                    }
                </div> 
            }/>

        </section>
    )
}