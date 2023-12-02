
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
provider.addScope('https://www.googleapis.com/auth/userinfo.email')
const auth = getAuth();
auth.useDeviceLanguage();


export function LogIn(){
    signInWithPopup(auth, provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            console.log(token, user)
        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            // ...
        });
}


  
//   // Initialize Realtime Database and get a reference to the service
//   const database = firebase.database();
  
// export function writeReport(userId) {
//     database.ref(userId).set({
//         presence: Date.now()
//     });
// }