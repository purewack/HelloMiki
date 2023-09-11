import axios from 'axios'

export function getStatus(){
    return new Promise((resolve, rej)=>{
        axios('/status').then((resp)=>{
            resolve(resp.data);
        })
    })
}

export function getNetworkList(){
    return new Promise((resolve, rej)=>{
        axios('/network').then((resp)=>{
            console.log(resp)
            resolve(resp.data);
        })
    })
}


export function getLocalPresence(){
    return new Promise((resolve, rej)=>{
        axios('/scan').then((resp)=>{
            resolve(resp.data);
        })
    })
}