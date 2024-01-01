import { useCallback, useContext, useEffect, useReducer, useRef, useState } from "react";
import { TimeContext, address, catVoiceAlert, inDev } from "./App";
import { isApiEmulate, requestMockEvent, setServerTime } from "./REST";
import { 
    syncFromLocalStorage, syncToLocalStorage, 
    arrayPurgeOld, arrayMergeClose, 
    arrayAddSort, arrayRemoveTimestamped,  
    timestampEvent,
} from "./Helpers";
import Timeline from "./Components/Timeline";
import ItemList from "./Components/ItemList";

function useMotionWebSocket(onStateChange, onMessage){
    const liveWS = useRef(null)
    const liveWDT = useRef(null)

    useEffect(()=>{
        let openWS;

        openWS = ()=>{
            const st = liveWS.current?.readyState
            if(st === WebSocket.OPEN || st === WebSocket.CONNECTING ) return
            
            const ws = new WebSocket(`ws://${address}/ws/monitor`);
            ws.onerror   = ()=>{onStateChange('error')};
            ws.onclose   = ()=>{onStateChange('close')};;
            ws.onopen    = ()=>{onStateChange('open')};;
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
    },[onStateChange])

    const onWSMessage = useCallback((ev)=>{
        if(!ev) return
        // console.log(ev.data)
        const event = JSON.parse(ev.data)

        if(event.type === 'sensor'){
            onMessage('motion',{...event})
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
    },[onMessage])

    useEffect(()=>{
        if(onWSMessage && liveWS?.current){
            liveWS.current.onmessage = onWSMessage;
        }

        return ()=>{
            if(liveWS?.current) liveWS.current.onmessage = null;
        }
    },[onWSMessage])

    return onWSMessage
}

export function useMotionPanelLogic(currentTime){
    
    const [events, setEvents] = useState([]);
    const [armed, setArmed] = useState(true);

    const sense = (data)=>{
        setEvents(evs => {  
            const ev = timestampEvent(data)      
            const finalEvents = arrayMergeClose(
                arrayAddSort(
                    arrayPurgeOld(evs), 
                    ev
                )
            ,3);
            syncToLocalStorage('motion',finalEvents);
            return [...finalEvents]
        });
    }

    // const removeSense = (entry) => {
    //     const finalEvents = arrayRemoveTimestamped(
    //         arrayPurgeOld(events), 
    //         entry.time
    //     );
    //     setEvents(finalEvents);
    //     syncToLocalStorage('motion',finalEvents);
    // }

    
    const onWSEvent = useCallback((type,data)=>{
        if(type === 'motion' &&  data.now === 1){
            if(armed) catVoiceAlert('meow meow')
            sense(data);
        }
    },[armed])
    const onWSChange = useCallback((type,data)=>{
        switch(type){
            case 'open':
                dispatch({type:'live',state:true});
            break;

            case 'close':
            case 'error':
            default:
                dispatch({type:'live',state:false});
            break;
        }
    },[])
    const wsPostMessage = useMotionWebSocket(onWSChange, onWSEvent);

    const [currentState, dispatch] = useReducer((state, action)=>{
        switch(action.type){
            case 'live':
                return {...state, live: action.state}
           
            case 'arm_toggle':
                setArmed(!state.armed);
                return {...state, armed: !state.armed}
           
            case 'mock_event':
                wsPostMessage(action.event);
                return {...state}
           
            default:
                return {...state}
        }
    },{
        armed: true,
        live: false,
    })

    useEffect(()=>{
        const motions = arrayPurgeOld(syncFromLocalStorage('motion'));
        if(motions?.length)
        setEvents(motions);
    },[currentTime])

    return [currentState, dispatch, events]
}

export default function MotionPanel({onLiveStateChange}){

    const currentTime = useContext(TimeContext);
    useEffect(()=>{
        console.log(currentTime)
    }, [currentTime])
    const [state, dispatch, events] = useMotionPanelLogic(currentTime);
    
    useEffect(()=>{
        // console.log(state.armed)
        onLiveStateChange?.(state.live)
    },[state.live, onLiveStateChange])

    return (
        <section className={'List Monitor ' + (state.armed ? 'Arm' : 'Disarm')} >
            
            <div className={'LiveStatus '}>
            
            <Timeline className={'Card MotionTimeline'} 
                nowTime={currentTime}
                timestamps={events?.map(e => e.time)} 
                // timestamps={[1702531585000, 1702538785000, 1702556785000, 1702558705000, 1702559425000, 1702584625000, 1702591225000, 1702593924336]}
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
