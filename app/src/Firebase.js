
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue  } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider();
// provider.addScope('https://www.googleapis.com/auth/userinfo.email')
const auth = getAuth();
auth.useDeviceLanguage();

export function getAuthUID(){
  return window.sessionStorage.getItem("uid");
}


export function logInGoogle(onSuccess, onError){
    signInWithPopup(auth, provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            console.log(user)
            
            onSuccess?.(user.email) 
            window.sessionStorage.setItem("uid",user.uid);
        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            
            onError?.()
        });
}


// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);
export function writeReport() {
  const _auth = getAuthUID()
    if(!_auth) {
        throw new Error('no user authenticated')
    }
    set(ref(database, _auth+ '/presence'), {
        time: Date.now()
    });
}

let unSubscribeListen
export function registerListenReport(callback){
  const _auth = getAuthUID()
  console.log('Register Listener for ', _auth)
  unSubscribeListen = onValue(ref(database, _auth + '/presence'), (snapshot) => {
    callback?.(snapshot.val());
  });

}
export function unregisterListenReport(){
  unSubscribeListen?.()
}