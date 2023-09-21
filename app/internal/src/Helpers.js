//helper functions
export function timeStampEvent(ev){
  return {
    ...ev,
    timeHuman: new Date(ev.time).toLocaleTimeString(),
    dateHuman: new Date(ev.time).toLocaleDateString(),
  }
}
export function localStorageGetEvents(name,setter){
  let evs = [...Array(localStorage.length)];
  evs = evs.map((_,i)=>{
    const k = localStorage.key(i)
    if(k.startsWith(name)){
      return JSON.parse(localStorage.getItem(k))
    }
    return null
  })
  .filter((v,i) => v !== null)
  .sort((a,b) => b.time - a.time)
  setter(evs);
}
export function localStorageClearEvents(name){
  let evs = [...Array(localStorage.length)];
  evs = evs.map((e,i)=>{
    return localStorage.key(i)
  })
  evs.forEach(k=>{
    if(k.startsWith(name)) localStorage.removeItem(k);
  })
}
export function localStorageSetEvent(name,ev){
  localStorage.setItem(name+Date.now(),JSON.stringify(ev));
}


export function setEventAuto(name,last,data,setter){
  const now = Date.now();
  const ee = timeStampEvent({
    time: now,
    ...data
  })

  const hnow = new Date();
  const hlast = new Date(last)
  const hdelta = hnow.getHours() - hlast.getHours();
  // console.log(hnow, hlast, hdelta)

  if(hdelta < 0){
    localStorageClearEvents(name)
    setter([ee])
  }else
    setter(f => [ee,...f])

  localStorageSetEvent(name,ee)
}  
export function feed(amount, last = undefined, setter){
  setEventAuto('feed',last,{amount},setter)
}
export function motion(event, last = undefined, setter){
  setEventAuto('motion',last,{event},setter)
}