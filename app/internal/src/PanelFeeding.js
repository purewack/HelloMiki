import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import {TimeContext} from './App';
import { localStorageDeleteKeys, localStoragePurgeOldKeys, localStorageTimestampSet } from './Helpers';
import { NavBar, NavOption, NavSet } from './Components/NavBar';
import ItemList from './Components/ItemList';
import Timeline from './Components/Timeline';
import PopUp from './Components/PopUp';


function useFeedingLogic(currentTime){
    const [events, setEvents] = useState([]);
    const [currentState, dispatch] = useReducer((state, action)=>{
        switch(action.type){
            case 'show_late_feed':
                return {...state, showFeedingLate: true};
    
            case 'hide_late_feed':
                return {...state, showFeedingLate: false};
    
            case 'feed_late': 
                return {...state, amountLate: action.amount};

            case 'feed_late_submit': 
                {
                    const t = action.time.split(':');
                    const d = new Date();
                    d.setHours(t[0])
                    d.setMinutes(t[1])
                    const late = d.valueOf()
                    if(late > Date.now()) {
                        return {...state, showFeedingLate: false}
                    }
                    localStoragePurgeOldKeys('feed',setEvents);
                    localStorageTimestampSet('feed', action.amount, setEvents, late)
                }

                return {...state, delta:'0h 0min', dt:0, showFeedingLate: false};
            

            case 'feed':
                localStoragePurgeOldKeys('feed',setEvents);
                localStorageTimestampSet('feed', action.amount, setEvents)
                return {...state};
           

            case 'feed_delete':
                localStorageDeleteKeys('feed',action.entry,setEvents);
                return {...state};
            

            case 'new_delta':
                return {...state, delta: action.delta, dt: action.dt};
            
            default:
                return {...state};
        }
    }, {
        delta: null,
        dt: 0,
        showFeedingLate: false,
        lateAmount: 0,
    });

    useEffect(()=>{
        if(events[0]?.time){
            const now = new Date();
            const dt = new Date(now - events[0].time);
            const delta = dt.getHours()-1 + 'h ' + dt.getMinutes() + 'min'
            dispatch({type:'new_delta', delta, dt})
        }
        else
            dispatch({type:'new_delta', delta: '0h 0min', dt:0})
    },[events, currentTime])

    
    useEffect(()=>{
        localStoragePurgeOldKeys('feed',setEvents);
    },[currentTime])
    
    return [currentState, dispatch, events];
}

export default function FeedingPanel(){

    const currentTime = useContext(TimeContext);
    const [state, dispatch, events] = useFeedingLogic(currentTime);
    const lateInput = useRef(null);

    return <section className='List Food' >
        <NavBar className='Controls'>
        <NavSet>
            <NavOption icon={'Time'} title={'Late'}  action={()=>{  dispatch({type: 'show_late_feed'})    }}/>
            <NavOption icon={'Food'} title={'Snack'} action={()=>{  dispatch({type: 'feed', amount:0.1})  }} className='FeedSnack' />
            <NavOption icon={'Food'} title={'1/2'}   action={()=>{  dispatch({type: 'feed', amount:0.5})  }} className='FeedHalf' />
            <NavOption icon={'Food'} title={'1'}     action={()=>{  dispatch({type: 'feed', amount:1.0})  }}/>
        </NavSet>
        </NavBar>

        <ItemList items={events}
        // onClickShow={(willShow)=>{setShowFeedingList(willShow)}}
        Template={({item, className, isPreview})=>
        <li className={'FeedItemContent ' 
        + className 
        + (isPreview ? ' Preview ' : '')  
        }>
            {isPreview && <div className='Actions'>
            <button onClick={(ev)=>{
                ev.stopPropagation()
                dispatch({type:'feed_delete', entry: 'feed'+item.time})
            }}><img alt='bin' className='Icon SVG Bin'/></button>
            </div>}
            <div className={'EventTimeBanner'}>
            {isPreview ? <>
                <p className='EventTime'>{item.timeHuman}</p>
                <p className='EventDay'>{item.dateHuman}</p>
            </>
            :
            <>
                <p className='EventTimeDelta'>{state.delta}</p>
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
            timestamps={events.map(e => e.time)} 
        />
        
        <PopUp className="FeedLate" trigger={state.showFeedingLate} onExit={()=>{dispatch({type:'hide_late_feed'})}}>
            <h1>When?</h1>
            <form onSubmit={(e)=>{
                e.preventDefault()
                dispatch({type: 'feed_late_submit', amount: state.lateAmount, time: lateInput.current.value})
            }}>
            <button type='submit' onClick={()=>{dispatch({type: 'feed_late', amount:1.0}) }}>
                <img alt='food' className='Icon SVG Food'/>
                Full
            </button>
            <button type='submit' onClick={()=>{dispatch({type: 'feed_late', amount:0.5}) }} className='FeedHalf'>
                <img alt='food' className='Icon SVG Food'/>
                Half
            </button>
            <button type='submit' onClick={()=>{dispatch({type: 'feed_late', amount:0.1}) }} className='FeedSnack'>
                <img alt='food' className='Icon SVG Food'/>
                Snack
            </button>
            <input ref={lateInput} type="time" id="appt" name="appt" defaultValue="12:00" />
            </form>
        </PopUp>
    </section>
}
