#include "server.h"
#include "sensor.h"
#include "StringJSON.h"

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
    pinMode(D5,INPUT_PULLUP);
    pinMode(D6,INPUT_PULLUP);
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN,1);

    sensors[0].pin = D5;
    sensors[1].pin = D6;
}

void monitorWatchdog(){

    sensors[0].poll();
    sensors[1].poll();
    bool hasSense = sensors[0].eventUnspent || sensors[1].eventUnspent;
    digitalWrite(LED_BUILTIN,!hasSense);

if(hasSense){
    if(!ws.availableForWriteAll()) return;
    String json;
    JSON_ARRAY(json,
        JSON_OBJECT(json,
            if(sensors[0].state){
                sensors[0].eventUnspent = false;
                JSON_KV(json,"sensor_id",0);
                    JSON_NEXT(json);
                JSON_KV(json,"server_timestamp",sensors[0].whenRising);
            }
        );
        JSON_NEXT(json);
        JSON_OBJECT(json,
            if(sensors[1].state){
                sensors[1].eventUnspent = false;
                JSON_KV(json,"sensor_id",1);
                    JSON_NEXT(json);
                JSON_KV(json,"server_timestamp",sensors[1].whenRising);
            }
        );
    );
    ws.printfAll(json.c_str());
}

    // auto now = millis();
    // if(now > sensorHistory+1000){
    //     sensorHistory = now;
    //     ws.printfAll("%d, %d.%d",now, digitalRead(D5), digitalRead(D6));
    // }
}