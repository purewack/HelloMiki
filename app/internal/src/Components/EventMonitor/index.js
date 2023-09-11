import './index.css'

export default function EventMonitor({monitorEvents}){
    return <section className='Monitor'>
      <h1>Cat Events:</h1>
      {/* <button onClick={catVoiceAlert}>Test Alert</button> */}
      <ul className='Events'>
        {monitorEvents.map((e,i) => {
          return <li className={'Event'} key={`event_${e.time}`}>{JSON.stringify(e)}</li>
        })}
      </ul>
    </section> 
}