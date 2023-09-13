#include "server.h"
#include "sensor.h"
#include "StringJSON.h"
#include "libdarray.h"

long timeOffset = 0;
struct Event{
    char sensor;
    long time;
};

Event pastEventsBuf[128];
sarray_t<Event> pastEvents;

struct SensorEvent{
    bool state = 0;
    bool stateOld = 0;
    bool eventUnspent = 0;
    long whenRising = 0;
    long whenFalling = 0;
    int pin;
    long timeout;
    void poll(){
        if(timeout) {
            timeout--;
            delay(1);
            return;
        }
        state = !digitalRead(pin);
        if(state && !stateOld) {
            eventUnspent = true;
            whenRising = millis();
            timeout = 250;
        }
        if(!state && stateOld) {
            whenFalling = millis();
        }

        stateOld = state;
    }
};

SensorEvent sensors[2];

void setupMonitor(){
    pastEvents.buf = pastEventsBuf;
    pastEvents.lim = 128;
    sarray_clear(pastEvents);

    pinMode(D5,INPUT_PULLUP);
    pinMode(D6,INPUT_PULLUP);
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN,1);

    sensors[0].pin = D5;
    sensors[1].pin = D6;
}

void monitorWatchdog(void(*onSense)(void)){

    sensors[0].poll();
    sensors[1].poll();
    bool hasSense = sensors[0].eventUnspent || sensors[1].eventUnspent;
    digitalWrite(LED_BUILTIN,!hasSense);


if(hasSense){

    if(sensors[0].eventUnspent){
        sarray_push(pastEvents, {
            0,
            timeOffset + sensors[0].whenRising,
        });
    }
    if(sensors[1].eventUnspent){
        sarray_push(pastEvents, {
            1,
            timeOffset + sensors[1].whenRising,
        });
    }

    if(onSense) onSense();
    if(!ws.availableForWriteAll()) return;
    String json;
    JSON_ARRAY(json,
        if(sensors[0].state){
            JSON_OBJECT(json,
                JSON_KV(json,"sensor_id",0);
                    JSON_NEXT(json);
                JSON_KV(json,"server_timestamp",timeOffset + sensors[0].whenRising);
            );
            sensors[0].eventUnspent = false;
        }

        if(sensors[0].state && sensors[1].state)
        JSON_NEXT(json);

        if(sensors[1].state){
            JSON_OBJECT(json,
                JSON_KV(json,"sensor_id",1);
                    JSON_NEXT(json);
                JSON_KV(json,"server_timestamp",timeOffset + sensors[1].whenRising);
            );
            sensors[1].eventUnspent = false;
        }
    );
    ws.printfAll(json.c_str());
}

    // auto now = millis();
    // if(now > sensorHistory+1000){
    //     sensorHistory = now;
    //     ws.printfAll("%d, %d.%d",now, digitalRead(D5), digitalRead(D6));
    // }
}

void requestOnPastEvents(AsyncWebServerRequest* request){
    if(request->hasParam("action")){
        auto p = request->getParam("action")->value();
        if(p == "get"){
            String json;
            JSON_ARRAY(json,
                for(int i=0; i<pastEvents.count; i++){
                    if(i) JSON_NEXT(json);
                    JSON_OBJECT(json,
                        JSON_KV(json, "time",pastEventsBuf[i].time);
                            JSON_NEXT(json);
                        JSON_KV(json, "sensor_id",int(pastEventsBuf[i].sensor));
                    );
                }
            );
            request->send(200, "text/json", json);
        }
        else if(p == "clear"){
            sarray_clear(pastEvents);
            request->send(200);
        }
        else if(p == "count"){
            request->send(200, "text/plain", String(pastEvents.count));
        }
    }
    request->send(400);
}