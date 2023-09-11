
export function getStatus(){
    return new Promise((resolve, rej)=>{
        setTimeout(()=>{
            resolve({connected:true})
        },1000);
    })
}

export function getNetworkList(){
    return new Promise((resolve, rej)=>{
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
}


export function getLocalPresence(){
    return new Promise((resolve, rej)=>{
        setTimeout(()=>{
            resolve({
                zone: 'house',
                direction: 'entered',
            });
        },200);
    })
}