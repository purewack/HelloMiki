#include "server.h"
#include "sensor.h"
#include "StringJSON.h"
#include "libdarray.h"

bool isArmed = true;
long timeOffset = 0;

enum Location{
    HOME = 0,
    GARDEN = 1,
    ROAD = 2
};
Location currentLocation = GARDEN;

enum EventType{
    LEAVE = -1,
    WAIT = 0,
    ENTER = 1
};
struct Event{
    char sensor;
    long time;
    Location location;
    EventType type;
};

Event pastEventsBuf[64];
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
            timeout = 500;
        }
        if(!state && stateOld) {
            whenFalling = millis();
        }

        stateOld = state;
    }
};

SensorEvent sensors[3];

void setupMonitor(){
    pastEvents.buf = pastEventsBuf;
    pastEvents.lim = 64;
    sarray_clear(pastEvents);

    pinMode(D5,INPUT_PULLUP);
    pinMode(D6,INPUT_PULLUP);
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN,1);

    sensors[0].pin = D5;
    sensors[1].pin = D6;
    sensors[2].pin = D7;
}

void monitorWatchdog(void(*onSense)(void)){

    sensors[0].poll();
    sensors[1].poll();
    sensors[2].poll();

    bool eventUnspent = sensors[0].eventUnspent || sensors[1].eventUnspent || sensors[2].eventUnspent;
    digitalWrite(LED_BUILTIN,!eventUnspent);

    if(eventUnspent){
    String json;

    //see eventLogic.drawio.png

    //sensor Prox
    if(sensors[2].eventUnspent){
        sensors[2].eventUnspent = false;
        if(currentLocation == HOME){
            currentLocation = GARDEN;
            sarray_push(pastEvents, {
                2,
                timeOffset + sensors[2].whenRising,
                currentLocation,
                LEAVE
            });
            Serial.println("leave");
            if(ws.availableForWriteAll()){
                JSON_OBJECT(json,
                    JSON_KV(json,"sensor_id",2);
                        JSON_NEXT(json);
                    JSON_KV(json,"time",timeOffset + sensors[2].whenRising);
                        JSON_NEXT(json);
                    JSON_KV(json,"location", currentLocation);
                        JSON_NEXT(json);
                    JSON_KV(json,"type", LEAVE);
                );
                ws.printfAll(json.c_str());
            }
        }
        else{
            currentLocation = HOME;
            sarray_push(pastEvents, {
                2,
                timeOffset + sensors[2].whenRising,
                currentLocation,
                ENTER
            });
            Serial.println("enter");
            if(ws.availableForWriteAll()){
                JSON_OBJECT(json,
                    JSON_KV(json,"sensor_id",2);
                        JSON_NEXT(json);
                    JSON_KV(json,"time",timeOffset + sensors[2].whenRising);
                        JSON_NEXT(json);
                    JSON_KV(json,"location", currentLocation);
                        JSON_NEXT(json);
                    JSON_KV(json,"type", ENTER);
                );
                ws.printfAll(json.c_str());
            }
        }
    }

    //sensor RFID
    if(sensors[1].eventUnspent){
        sensors[1].eventUnspent = false;
        if(currentLocation == GARDEN){
            currentLocation = ROAD;
            sarray_push(pastEvents, {
                1,
                timeOffset + sensors[1].whenRising,
                currentLocation,
                LEAVE
            });
            Serial.println("leave");
            if(ws.availableForWriteAll()){
                JSON_OBJECT(json,
                    JSON_KV(json,"sensor_id",1);
                        JSON_NEXT(json);
                    JSON_KV(json,"time",timeOffset + sensors[1].whenRising);
                        JSON_NEXT(json);
                    JSON_KV(json,"location", currentLocation);
                        JSON_NEXT(json);
                    JSON_KV(json,"type", LEAVE);
                );
                ws.printfAll(json.c_str());
            }
        }
        else{
            currentLocation = GARDEN;
            sarray_push(pastEvents, {
                1,
                timeOffset + sensors[1].whenRising,
                currentLocation,
                ENTER
            });
            Serial.println("enter");
            if(ws.availableForWriteAll()){
                JSON_OBJECT(json,
                    JSON_KV(json,"sensor_id",1);
                        JSON_NEXT(json);
                    JSON_KV(json,"time",timeOffset + sensors[1].whenRising);
                        JSON_NEXT(json);
                    JSON_KV(json,"location", currentLocation);
                        JSON_NEXT(json);
                    JSON_KV(json,"type", ENTER);
                );
                ws.printfAll(json.c_str());
            }
        }
    }

    //sensor motion
    if(sensors[0].eventUnspent){
        sensors[0].eventUnspent = false;
        if(currentLocation == GARDEN){ 
            sarray_push(pastEvents, {
                0,
                timeOffset + sensors[0].whenRising,
                currentLocation,
                WAIT
            });
            Serial.println("wait");
            if(ws.availableForWriteAll()){
                JSON_OBJECT(json,
                    JSON_KV(json,"sensor_id",0);
                        JSON_NEXT(json);
                    JSON_KV(json,"time",timeOffset + sensors[0].whenRising);
                        JSON_NEXT(json);
                    JSON_KV(json,"location", currentLocation);
                        JSON_NEXT(json);
                    JSON_KV(json,"type", WAIT);
                );
                ws.printfAll(json.c_str());
            }
        }
    }
    }
    
}

void requestOnPastEvents(AsyncWebServerRequest* request){
    if(request->hasParam("action")){
        auto p = request->getParam("action")->value();
        if(p == "get"){
            String json;
            JSON_ARRAY(json,
                for(unsigned int i=0; i<pastEvents.count; i++){
                    if(i) JSON_NEXT(json);
                    JSON_OBJECT(json,
                        JSON_KV(json, "time",pastEventsBuf[i].time);
                            JSON_NEXT(json);
                        JSON_KV(json, "sensor_id", int(pastEventsBuf[i].sensor));
                            JSON_NEXT(json);
                        JSON_KV(json, "type", int(pastEventsBuf[i].type));
                            JSON_NEXT(json);
                        JSON_KV(json, "location",int(pastEventsBuf[i].location));
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
    else if(request->hasParam("location")){
        currentLocation = Location(request->getParam("location")->value().toInt());
        request->send(200);
    }
    request->send(400);
}