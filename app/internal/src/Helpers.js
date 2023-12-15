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
  localStorage.setItem(name+ev.time,JSON.stringify(ev));
}
export function localStorageDeleteEvent(name, key, setter){
  localStorage.removeItem(key);
  localStorageGetEvents(name, setter);
}


export function setEventAuto(name,last,data,setter, atTime = undefined){
  const ee = timeStampEvent({
    time: atTime ? atTime : Date.now(),
    ...data
  })

  const hnow = new Date(atTime);
  const hlast = new Date(last)
  const hdelta = hnow.getHours() - hlast.getHours();
  // console.log(hnow, hlast, hdelta)

  if(hdelta < 0 && !atTime){
    localStorageClearEvents(name)
    setter([ee].sort((a,b) => b.time - a.time))
  }else
    setter(f => [ee,...f].sort((a,b) => b.time - a.time))

  localStorageSetEvent(name,ee)
}  
export function feed(amount, last = undefined, setter, atTime = undefined){
  setEventAuto('feed',last,{amount},setter, atTime)
}
export function motion(event, last = undefined, setter, atTime = undefined){
  setEventAuto('motion',last,{event},setter, atTime)
}
export function arm(event, last = undefined, setter, atTime = undefined){
  setEventAuto('arm',last,{event},setter, atTime)
}

export function isDaytime(timestamp) {
  const date = new Date(timestamp);

  // Define sunrise and sunset times for each month (in minutes from midnight)
  const monthlyTimes = [
    { sunrise: 490, sunset: 1080 }, // January
    { sunrise: 430, sunset: 1100 }, // February
    { sunrise: 390, sunset: 1120 }, // March
    { sunrise: 350, sunset: 1140 }, // April
    { sunrise: 330, sunset: 1260 }, // May
    { sunrise: 300, sunset: 1280 }, // June
    { sunrise: 300, sunset: 1280 }, // July
    { sunrise: 330, sunset: 1260 }, // August
    { sunrise: 350, sunset: 1140 }, // September
    { sunrise: 390, sunset: 1120 }, // October
    { sunrise: 430, sunset: 1100 }, // November
    { sunrise: 490, sunset: 1080 }, // December
  ];

  // Get the corresponding times for the current month
  const currentMonth = date.getMonth();
  const currentSunrise = monthlyTimes[currentMonth].sunrise;
  const currentSunset = monthlyTimes[currentMonth].sunset;

  // Calculate the total minutes since midnight
  const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();
  const isDay = (minutesSinceMidnight >= currentSunrise) && (minutesSinceMidnight <= currentSunset);
  // Check if it's currently within the sunrise and sunset times
  console.log(timestamp,isDay, minutesSinceMidnight, currentSunrise, currentSunset)
  return isDay;
}