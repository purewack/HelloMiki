import { useEffect, useRef, useState } from 'react';
import './App.css';

import { postPresence, registerPresenceCallback} from './Database';
import axios from "axios"

import meowSound from "./Res/meow.mp3"

function App() {

  const [started, setStarted] = useState(false);

  const [present, setPresent] = useState(false);
  const audio = useRef()
  const [useSound, setUseSound] = useState(true);

  const ref = useRef();
  // useEffect(()=>{
  //   const check = ()=>{
  //     axios.get("http://hellomiki.local/ispresent").then(v => {
  //       setPresent(v.data.isPresent);
  //     })
  //   }
  //   check();
  //   ref.current = setInterval(check, 1000);
  //   return ()=>{
  //     if(ref) clearInterval(ref.current)
  //   }
  // })

  useEffect(()=>{
    if(!useSound){
      audio.current?.pause();
      return;
    }
    if(present){
      audio.current?.play();
    }
  }, [present, useSound])

  useEffect(()=>{
    audio.current = new Audio(meowSound);
    registerPresenceCallback((data)=>{
      console.log(data.toJSON(), data.key);
    })
  },[])

  return (
    <div className="App">
      {!started ?
      <header onClick={()=>{setStarted(true)}} className='Intro'>
        <h1>Hello Miki</h1>
        <p>Press to start monitor</p>
      </header>
      :
      <header className="Summary">
        <h1>Hello Miki!</h1>
        <p>{present ? "Detected" : "Waiting"}</p>
        <button onClick={()=>{setUseSound(s => !s)}}>{useSound ? "Mute" : "Use Sounds"}</button>
        <button onClick={()=>{
          postPresence()
        }}>Post</button>
      </header>}
    </div>
  );
}

export default App;
