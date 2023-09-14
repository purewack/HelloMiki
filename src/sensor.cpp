#include "server.h"
#include "sensor.h"
#include "StringJSON.h"
#include "libdarray.h"

bool isArmed = true;
double timeOffset = 0;
double timeWhenSet = 0;

enum Location{
    HOME = 0,
    GARDEN = 1,
    ROAD = 2
};
Location currentLocation = HOME;
Location lastLocation = HOME;

struct Event{
    double time;
    Location now;
    Location last;
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
            // whenRising = millis();
            timeout = 500;
        }
        if(!state && stateOld) {
            // whenFalling = millis();
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
    pinMode(D7,INPUT_PULLUP);
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN,1);

    sensors[0].pin = D5;
    sensors[1].pin = D6;
    sensors[2].pin = D7;
}

void liveSave(Location currentLocation, Location lastLocation){
    sarray_insert(pastEvents, {
        timeOffset + double(millis()) - timeWhenSet,
        currentLocation,
        lastLocation
    },0);
}

void livePost(String &json, Location currentLocation, Location lastLocation){
    if(ws.availableForWriteAll()){
        JSON_OBJECT(json,
            JSON_KV(json,"time",timeOffset + double(millis()) - timeWhenSet);
                JSON_NEXT(json);
            JSON_KV(json,"now", currentLocation);
                JSON_NEXT(json);
            JSON_KV(json,"prev", lastLocation);
        );
        ws.printfAll(json.c_str());
    }
}

//see eventLogic.drawio.png
void monitorWatchdog(void(*onSense)(int locNow, int locPrev)){

    // sensors[0].poll();
    sensors[1].poll();
    sensors[2].poll();

    bool eventUnspent = sensors[0].eventUnspent || sensors[1].eventUnspent || sensors[2].eventUnspent;
    digitalWrite(LED_BUILTIN,!eventUnspent);

    if(eventUnspent && isArmed){
    String json;

    //sensor RFID
    if(sensors[2].eventUnspent){
        sensors[2].eventUnspent = false;
        if(currentLocation == GARDEN){
            lastLocation = currentLocation;
            currentLocation = ROAD;
            liveSave(currentLocation,lastLocation);
            livePost(json,currentLocation,lastLocation);
            onSense(currentLocation, lastLocation);
        }
        else if(currentLocation == ROAD){
            lastLocation = currentLocation;
            currentLocation = GARDEN;
            liveSave(currentLocation,lastLocation);
            livePost(json,currentLocation,lastLocation);
            onSense(currentLocation, lastLocation);
        }
    }

    //sensor motion
    if(sensors[1].eventUnspent){
        sensors[1].eventUnspent = false;
        // if(lastLocation == ROAD){ 
            lastLocation = currentLocation;
            currentLocation = GARDEN;
            liveSave(currentLocation,lastLocation);
            livePost(json,currentLocation,lastLocation);
            onSense(currentLocation, lastLocation);
        // }
    }

        //sensor Prox
    // if(sensors[0].eventUnspent){
    //     sensors[0].eventUnspent = false;

    //     if(currentLocation == HOME && lastLocation == GARDEN){
    //         currentLocation = GARDEN;
    //         lastLocation = HOME;
    //         sarray_push(pastEvents, {
    //             timeOffset + now,
    //             currentLocation,
    //             lastLocation,
    //         });
    //         if(ws.availableForWriteAll()){
    //             JSON_OBJECT(json,
    //                 JSON_KV(json,"time",timeOffset + now);
    //                     JSON_NEXT(json);
    //                 JSON_KV(json,"now", currentLocation);
    //                     JSON_NEXT(json);
    //                 JSON_KV(json,"prev", lastLocation);
    //                     JSON_NEXT(json);
    //             );
    //             ws.printfAll(json.c_str());
    //         }
    //         onSense(currentLocation, lastLocation);
    //     }
    //     else if(currentLocation == GARDEN && lastLocation == HOME){
    //         currentLocation = HOME;
    //         lastLocation = GARDEN;
    //         sarray_push(pastEvents, {
    //             timeOffset + now,
    //             currentLocation,
    //             lastLocation
    //         });
    //         if(ws.availableForWriteAll()){
    //             JSON_OBJECT(json,
    //                 JSON_KV(json,"time",timeOffset + now);
    //                     JSON_NEXT(json);
    //                 JSON_KV(json,"now", currentLocation);
    //                     JSON_NEXT(json);
    //                 JSON_KV(json,"prev", lastLocation);
    //                     JSON_NEXT(json);
    //             );
    //             ws.printfAll(json.c_str());
    //         }
    //         onSense(currentLocation, lastLocation);
    //     }
    // }

    }
    
}

void requestOnPastEvents(AsyncWebServerRequest* request){
    if(request->hasParam("action")){
        auto p = request->getParam("action")->value();
        if(p == "get"){
            String json;
            int ii = pastEvents.count > 10 ? 10 : pastEvents.count;
            JSON_ARRAY(json,
                for(unsigned int i=0; i<ii; i++){
                    if(i) JSON_NEXT(json);
                    JSON_OBJECT(json,
                        JSON_KV(json, "time",pastEventsBuf[i].time);
                            JSON_NEXT(json);
                        JSON_KV(json, "now",int(pastEventsBuf[i].now));
                            JSON_NEXT(json);
                        JSON_KV(json, "prev",int(pastEventsBuf[i].last));
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
            request->send(200, "text/json", String(pastEvents.count));
        }
    }
    if(request->hasParam("location")){
        currentLocation = Location(request->getParam("location")->value().toInt());
        request->send(200);
    }
    if(request->hasParam("arm")){
        isArmed = request->getParam("arm")->value().toInt();
        request->send(200);
    }
    if(request->hasParam("isArmed")){
        request->send(200, "text/json", JBOOL(isArmed));
    }
    request->send(400);
}