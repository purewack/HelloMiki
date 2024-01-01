//events storage and manipulation

export function syncFromLocalStorage(name){
  return JSON.parse(localStorage.getItem(name)) || []
}

export function syncToLocalStorage(name, items){
  localStorage.setItem(name,JSON.stringify(!items ? [] : items));
}


export function arrayAddSort(items, newItem){
  if(!items || !items?.length) return [newItem]
  items.push(newItem)
  return items.sort((a,b) => b.time - a.time);
}

export function arrayRemoveTimestamped(items, time){
  if(!items || !items?.length) return []
  const indexToRemove = items.findIndex(item => item.time === time);
  if (indexToRemove !== -1) items.splice(indexToRemove, 1);
  return [...items];
}

export function timestampEvent(data, atTime = undefined){
  const time = atTime ? atTime : Date.now();
  return { 
    time,
    timeHuman: new Date(time).toLocaleTimeString(),
    dateHuman: new Date(time).toLocaleDateString(),
    ...data
  }
}  

export function arrayPurgeOld(items, hours = 22){
  if(!items || !items?.length) return []
  return items.filter(ev => {
    if(ev.time < (Date.now() - (hours * 3600000)))//older than x hours
      return false;
    
    return true;
  })
}

export function arrayMergeClose(items, thresholdMins) {
  if(!items || !items?.length) return []

  items.sort((a, b) => a.time - b.time);

  const filteredArray = [items[0]]; // Initialize with the first element

  for (let i = 1; i < items.length; i++) {
    const currentObject = items[i];
    const lastObject = filteredArray[filteredArray.length - 1];

    const timeDifference = (currentObject.time - lastObject.time) / (60 * 1000);

    if (timeDifference < thresholdMins) {
      // If the time difference is less than the threshold, discard the older object
      filteredArray.pop();
    }

    // Add the current object to the filtered array
    filteredArray.push(currentObject);
  }
  return filteredArray.sort((a,b)=> b.time - a.time);
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