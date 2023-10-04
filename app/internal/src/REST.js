import axios from 'axios'

let apiAddress = '';
let emulateApi = (!process.env?.REACT_APP_HW_SERVER_IP) && (process.env.NODE_ENV !== 'production');

export function setApiAddress(ip){
    if(ip){
        apiAddress = 'http://' + ip
        emulateApi = false
    }
    else{
        apiAddress = ''        
        emulateApi = true
    }
}
const hwip = process.env?.REACT_APP_HW_SERVER_IP
if(hwip) setApiAddress(hwip);

export function getApiAddress(){
    return apiAddress;
}
export function toggleEmulateApi(){
    emulateApi = !emulateApi;
}
export function isApiEmulate(){
    return emulateApi;
}

export function requestMockEvent(){
    if(emulateApi) return null;
    return {
        time: Date.now(),
        prev: 1,
        now: 1
    };
}

export function getNetworkList(){
    return new Promise((resolve, rej)=>{
        if(!emulateApi){
            axios(apiAddress+'/network/scan').then((resp)=>{
                resolve(resp.data);
            })
        }
        else{
            setTimeout(()=>{
                resolve([
                    {ssid:"*_FAKE_network1_*", strength:-70, channel:2, wps: false},
                    {ssid:"*_FAKE_network2_*", strength:-40, channel:0, wps: true},
                    {ssid:"*_FAKE_network3_*", strength:-60, channel:1, wps: false},
                    {ssid:"*_FAKE_network4_*", strength:-50, channel:0, wps: true},
                    {ssid:"*_FAKE_network"+Math.random(), strength:-90*Math.random(),channel:1, wps: true},
                ])
            },1000);
        }
    })
}

export function getNetworkState(){
    return new Promise((resolve, rej)=>{
        if(!emulateApi){
            axios(apiAddress+'/status/network').then((resp)=>{
                resolve(resp.data);
            })
        }
        else{   
            setTimeout(()=>{
                resolve(
                    {ssid:"*_FAKE_network3_*", strength:-70}
                )
            },1000);
        }
    })
}

export function setServerTime(timestampUTC){
    if(!emulateApi){
        axios(apiAddress+'/time?set='+timestampUTC);
    }
}

export function getServerUptime(){
    if(!emulateApi){
        return axios(apiAddress+'/time?uptime')
    }
    return new Promise((res,rej)=>{
        res(10000);
    })
}