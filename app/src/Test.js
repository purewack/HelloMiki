import { LogIn } from "./Firebase";

export default function Test(){
    return <>
        <button onClick={()=>{
        LogIn();
        }}>Log In</button>
    </>
}