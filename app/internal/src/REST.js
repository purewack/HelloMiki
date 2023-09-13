import axios from 'axios'

let address = process.env?.REACT_APP_HW_SERVER_IP
if(address) address = 'http://' + address
else address = ''

export function getNetworkList(){
    return new Promise((resolve, rej)=>{
        axios(address+'/network/scan').then((resp)=>{
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
        axios(address+'/status/network').then((resp)=>{
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
            axios(address+'/events?action=get').then((resp)=>{
            resolve(resp.data);
        }).catch(()=>{
            setTimeout(()=>{
                resolve([
                    {sensor_id:0, time: Date.now()},
                    {sensor_id:1, time: Date.now() + 10000}
                ])
            },1000);
        })
    })
}