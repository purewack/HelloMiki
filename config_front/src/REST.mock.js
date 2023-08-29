
export function getStatus(){
    return new Promise((resolve, rej)=>{
        setTimeout(()=>{
            resolve({connected:false})
        },1000);
    })
}

export function getNetworkList(){
    return new Promise((resolve, rej)=>{
        setTimeout(()=>{
            resolve([
                {ssid:"network_main", strength:-40},
                {ssid:"network1", strength:-50},
                {ssid:"network2", strength:-60},
                {ssid:"network3", strength:-70},
                {ssid:"network_rand_"+Math.random(), strength:-90*Math.random()},
            ])
        },1000);
    })
}


export function getLocalPresence(){
    return new Promise((resolve, rej)=>{
        setTimeout(()=>{
            resolve({
                time: new Date().toUTCString(), 
                zone: 'house',
                direction: 'entered',
            });
        },200);
    })
}