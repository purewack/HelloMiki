import axios from 'axios'

export function getNetworkList(){
    return new Promise((resolve, rej)=>{
        axios('/network/scan').then((resp)=>{
            console.log(resp)
            resolve(resp.data);
        })
    })
}