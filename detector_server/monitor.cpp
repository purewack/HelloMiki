#include "server.h"
#include "hardware.h"
#include "monitor.h"
#include "StringJSON.h"

bool meow = false;
bool meowOld = false;

void requestOnStatusPresence(){
  String resp;
  JSON_OBJECT(resp,
    if(meow && !meowOld){
      JSON_KV_STR(resp, "direction", "enter");
    }else{
      JSON_KV(resp, "direction", JNULL);
    }
    meowOld = meow;
      
      JSON_NEXT(resp);
    JSON_KV_STR(resp, "zone", "home");
  );
  server.send(200, "text/json", resp);
}

void updateMonitor(){
  meow = digitalRead(PIN_SENSE);
}

bool didEnterPresence(){
  return meow;
}

bool didLeavePresence(){
  return !meow;
}
