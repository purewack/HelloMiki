// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getDatabase, ref, set, push, onChildAdded} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC5MxYn1otIixTZjsQ8UxvIbpxHsxVrSxY",
  authDomain: "hello-miki.firebaseapp.com",
  databaseURL: "https://hello-miki-default-rtdb.firebaseio.com",
  projectId: "hello-miki",
  storageBucket: "hello-miki.appspot.com",
  messagingSenderId: "493055526270",
  appId: "1:493055526270:web:b8cec3e182252c4f09df2f",
  measurementId: "G-3TC84XRRM5"
};

export function init(){
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
}

export function postPresence(){
    const db = getDatabase();
    const dbRef = ref(db, '/presence');
    
    push(dbRef, {
        time: new Date().toISOString()
    })
}

export function registerPresenceCallback(callback){
    const db = getDatabase();
    const dbRef = ref(db, '/presence');
    
    onChildAdded(dbRef, (data)=>{
        callback(data)
    })
}