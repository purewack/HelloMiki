import axios from 'axios'

export function getNetworkList(){
    return new Promise((resolve, rej)=>{
        axios('/network/scan').then((resp)=>{
            resolve(resp.data);
        }).catch(()=>{
            setTimeout(()=>{
                resolve([
                    {ssid:"network3", strength:-70,channel:2, wps: false},
                    {ssid:"network_main", strength:-40, channel:0, wps: true},
                    {ssid:"networkA_", strength:-60, channel:1, wps: false},
                    {ssid:"networkA", strength:-50, channel:0, wps: true},
                    {ssid:"network_rand_"+Math.random(), strength:-90*Math.random(),channel:1, wps: true},
                ])
            },1000);
        })
    })
}

export function getNetworkState(){
    return new Promise((resolve, rej)=>{
        axios('/status/network').then((resp)=>{
            resolve(resp.data);
        }).catch(()=>{
            setTimeout(()=>{
                resolve(
                    {ssid:"network3", strength:-70}
                )
            },1000);
        })
    })
}

export function getPastEvents(){
    return  new Promise((resolve, rej)=>{
            axios('/log/events').then((resp)=>{
            resolve(resp.data);
        }).catch(()=>{
            setTimeout(()=>{
                resolve([
                    {direction:'leaving',  time: new Date().toUTCString()},
                    {direction:'entering', time: new Date().toUTCString()}
                ])
            },1000);
        })
    })
}