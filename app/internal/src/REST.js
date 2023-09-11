import axios from 'axios'

export function getNetworkList(){
    return new Promise((resolve, rej)=>{
        axios('/network/scan').then((resp)=>{
            resolve(resp.data);
        })
    })
}

export function getNetworkState(){
    return new Promise((resolve, rej)=>{
        axios('/status/network').then((resp)=>{
            resolve(resp.data);
        })
    })
}

export function getPastEvents(){
    return new Promise((resolve, rej)=>{
        resolve([])
    })
}