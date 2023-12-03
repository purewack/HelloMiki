import { useEffect, useState } from "react";
import { getAuthUID, logInGoogle, registerListenReport, unregisterListenReport, writeReport } from "./Firebase";

export default function Test(){
    const [auth, setAuth] = useState(getAuthUID());
    const [presenceTime, setPresenceTime] = useState(null);

    useEffect(()=>{
        if(auth){
            registerListenReport((data)=>{
                console.log(data)
            })
        }
        return ()=>{
            unregisterListenReport()
        }
    },[auth])

    return !auth ? 
    <>
        <button onClick={()=>{
            logInGoogle((email)=>{
                setAuth(email)
            });
        }}>Log In</button> 
    </>
    :
    <>
        <button onClick={()=>{
            writeReport();
        }}>Test write</button>

        <p>Presence: {presenceTime}</p>
    </>
}