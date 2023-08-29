#include "server.h"
#include "hardware.h"
#include "monitor.h"
#include "StringJSON.h"

bool meow = false;
bool meowOld = false;

void isPresentHandle(){
  String resp;
  JSON_OBJECT(resp,
    if(meow){
      JSON_KV_STR(resp, "direction", "enter");
    }else{
      JSON_KV(resp, "direction", JNULL);
    }
      
      JSON_NEXT(resp);
    JSON_KV_STR(resp, "zone", "home");
  );
  server.send(200, "text/json", resp);
}

void updateMonitor(){
  meowOld = meow;
  meow = digitalRead(PIN_SENSE);
}

bool didEnterPresence(){
    return meow && !meowOld;
}

bool didLeavePresence(){
    return !meow && meowOld;
}
