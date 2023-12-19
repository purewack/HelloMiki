//helper functions
export function timeStampEvent(ev){
  return {
    ...ev,
    timeHuman: new Date(ev.time).toLocaleTimeString(),
    dateHuman: new Date(ev.time).toLocaleDateString(),
  }
}

export function localStorageGetKeys(name,setter){
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

export function localStorageClearKeys(name){
  let evs = [...Array(localStorage.length)];
  evs = evs.map((e,i)=>{
    return localStorage.key(i)
  })
  evs.forEach(k=>{
    if(k.startsWith(name)) localStorage.removeItem(k);
  })
}

export function localStorageSetKeys(name,ev){
  localStorage.setItem(name+ev.time,JSON.stringify(ev));
}

export function localStorageDeleteKeys(name, key, setter){
  localStorage.removeItem(key);
  localStorageGetKeys(name, setter);
}

export function localStoragePurgeOldKeys(name, setter, hours = 22){
  let evs = [...Array(localStorage.length)];
  evs = evs.map((e,i)=>{
    return localStorage.key(i)
  })
  evs.forEach(k=>{
    if(k.startsWith(name)) {
      const ev = JSON.parse(localStorage.getItem(k));
      if(ev.time < (Date.now() - (hours * 3600000))) { //older than 24h
        localStorage.removeItem(k);
      }
    }
  })
  localStorageGetKeys(name,setter);
}

export function localStorageTimestampSet(name,data,setter, atTime = undefined){
  const ee = timeStampEvent({
    time: atTime ? atTime : Date.now(),
    ...data
  })
  setter(f => [ee,...f].sort())
  localStorageSetKeys(name,ee)
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
  // console.log(timestamp,isDay, minutesSinceMidnight, currentSunrise, currentSunset)
  return isDay;
}