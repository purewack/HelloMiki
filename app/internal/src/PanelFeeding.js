import { useContext, useEffect, useReducer, useRef, useState } from 'react';
import {TimeContext} from './App';
import { 
    syncFromLocalStorage, syncToLocalStorage, 
    arrayPurgeOld, arrayMergeClose, 
    arrayAddSort, arrayRemoveTimestamped,  
    timestampEvent,
} from './Helpers';
import { NavBar, NavOption, NavSet } from './Components/NavBar';
import ItemList from './Components/ItemList';
import Timeline from './Components/Timeline';
import PopUp from './Components/PopUp';
import Slider from './Components/Slider';


function useFeedingLogic(currentTime){

    const [events, setEvents] = useState([]);

    const feed = (amount, time = undefined)=>{
        setEvents(evs => {  
            const ev = timestampEvent({amount},time)      
            const finalEvents = arrayMergeClose(
                arrayAddSort(
                    arrayPurgeOld(evs), 
                    ev
                )
            ,5);
            syncToLocalStorage('feed',finalEvents);
            return [...finalEvents]
        });
    }

    const removeFeed = (entry) => {
        console.log('remove',entry)
        setEvents(evs => {    
            const finalEvents = 
                arrayRemoveTimestamped(
                    arrayPurgeOld(evs), 
                    entry.time
                )
            syncToLocalStorage('feed',finalEvents);
            return [...finalEvents]
        });
    }


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
                    feed(action.amount, late);
                }

                return {...state, delta:'0h 0min', dt:new Date(), showFeedingLate: false};
            

            case 'feed':{
                feed(action.amount);
                return {...state};
            }

            case 'feed_delete':
                removeFeed(action.entry)
                return {...state};
            

            case 'new_delta':
                return {...state, delta: action.delta, dt: action.dt};
            
            default:
                return {...state};
        }
    }, {
        delta: null,
        dt: new Date(),
        showFeedingLate: false,
        lateAmount: 0,
    });

    useEffect(()=>{
        if(events?.[0]?.time){
            const now = new Date();
            const dt = new Date(now - events[0].time);
            const delta = dt.getHours()-1 + 'h ' + dt.getMinutes() + 'min'
            dispatch({type:'new_delta', delta, dt})
            // console.log('DT',dt);
        }
        else
            dispatch({type:'new_delta', delta: '0h 0min', dt:new Date()})
    },[events, currentTime])

    
    useEffect(()=>{
        const feeds = arrayPurgeOld(syncFromLocalStorage('feed'));
        if(feeds?.length)
        setEvents(feeds);
    },[currentTime])
    
    return [currentState, dispatch, events];
}

export default function FeedingPanel({feedingBar = true}){

    const currentTime = useContext(TimeContext);
    const [state, dispatch, events] = useFeedingLogic(currentTime);
    const lateInput = useRef(null);

    const shouldBeHungry = ()=>(state.dt.getHours() >= 3 && state.dt.getMinutes() >= 30)

    return <section className='List Food' >
        
        <NavBar className='Controls'>
        <NavSet>
            {feedingBar ? <>
                <Slider className={'Card Feeder'}
                forceSad={shouldBeHungry()}
                lastAmount={events?.[0]?.amount}
                onSlide={(amount)=>{
                    dispatch({type: 'feed', amount})
                }}/>
                <NavOption icon={'Time'} title={'Late'}  action={()=>{  dispatch({type: 'show_late_feed'})    }}/>
            </>
            :
            <>
                <NavOption icon={'Time'} title={'Late'}  action={()=>{  dispatch({type: 'show_late_feed'})    }}/>
                <NavOption icon={'Food'} title={'Snack'} action={()=>{  dispatch({type: 'feed', amount:0.1})  }} />
                <NavOption icon={'Food'} title={'1/2'}   action={()=>{  dispatch({type: 'feed', amount:0.5})  }} />
                <NavOption icon={'Food'} title={'1'}     action={()=>{  dispatch({type: 'feed', amount:1.0})  }}/>
            </>}
            
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
                    dispatch({type:'feed_delete', entry: item})
                }}>
                    <img alt='bin' className='Icon SVG Bin'/>
                </button>
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

            {isPreview && 
            <div className={'EventBanner Feed '} style={{'--amount':item.amount}}>
            <img alt=""  className={'Icon SVG Food'}/>
            <p>{item.amount > 0.6 ? 'Whole' : item.amount > 0.25 ? 'Half' : 'Snack'}</p>
            </div>
            }
            
        </li>
        }  
        />
        
        <Timeline className={'Card FeedingTimeline'} 
            nowTime={currentTime}
            timestamps={events?.map(e => e.time)} 
        />
        
        <PopUp className="FeedLate" trigger={state.showFeedingLate} onExit={()=>{dispatch({type:'hide_late_feed'})}}>
            <h1>When?</h1>
            <form onSubmit={(e)=>{
                e.preventDefault()
                dispatch({type: 'feed_late_submit', amount: state.lateAmount, time: lateInput.current.value})
            }}>
            
            <input ref={lateInput} type="time" id="appt" name="appt" defaultValue="12:00" />
           
            {feedingBar ? <>
                <Slider className={'Card Feeder'} onSlide={(amount)=>{
                    dispatch({type: 'feed_late', amount})
                    dispatch({type: 'feed_late_submit', amount: state.lateAmount, time: lateInput.current.value})  
                }}/>
            </>
            :
            <>
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
            </>}
             </form>
        </PopUp>
    </section>
}
