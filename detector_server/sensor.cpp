#include "server.h"
#include "sensor.h"
#include "StringJSON.h"


bool Sensor::poll(){
    if(omit) return false;
    if(port.invert) return !digitalRead(port.pin);
    return digitalRead(port.pin);
}

int SensorZone::poll(){
    bool in = triggerEnter.poll();
    bool out = triggerExit.poll();

    if( in && !out) return 1;
    if( !in && out) return 2;

    return 0;
}

String SensorZone::toJSON(){
    auto listTrigger = [](String &s, auto trigger){
        JSON_OBJECT(s, 
            JSON_KV(s, "id", trigger.id);
                JSON_NEXT(s);
            JSON_KV(s, "type", trigger.type);
                JSON_NEXT(s);
            JSON_KV(s, "port_pin", trigger.port.pin);
                JSON_NEXT(s);
            JSON_KV(s, "port_invert", trigger.port.invert);
        );
    };

    String json;
    JSON_OBJECT(json,
        JSON_KV_STR(json, "zone", zone);
            JSON_NEXT(json);
        JSON_KV(json, "reverse", JBOOL(reverseTriggerDirection));
            JSON_NEXT(json);
        JSON_KV_F(json,"triggerEnter",listTrigger(json,triggerEnter));
            if(!mono){
            JSON_NEXT(json);
        JSON_KV_F(json,"triggerExit",listTrigger(json,triggerExit));
            JSON_NEXT(json);
        JSON_KV_F(json,"triggerCancel",listTrigger(json,triggerCancel));
            }
    );
    return json;
}


SensorZone zones[2];
int zoneI = 0;
void pollZones(){
    int eventType = zones[zoneI].poll();
    zoneI++;
    zoneI %= 4;

}

void inspectPollZonesBlocking(){
    Serial.println("inspect sensor events {");
    for(int i=0; i<4; i++){
        Serial.println("{");
            auto zone = zones[i];
            int eventType = zone.poll();
            Serial.print("zone: "); Serial.println(zone.zone);
            Serial.print("eventType: "); Serial.println(eventType);
            Serial.print("triggerEnter: "); Serial.println(zone.triggerEnter.poll());
            Serial.print("triggerExit: "); Serial.println(zone.triggerExit.poll());
            Serial.print("triggerCancel: "); Serial.println(zone.triggerCancel.poll());
        Serial.println("}");
    }
    Serial.println("}");
}

void requestOnStatusSensors(){
    String json;
    JSON_ARRAY(json,
        json += zones[0].toJSON();
            JSON_NEXT(json);
        json += zones[1].toJSON();
    );
    server.send(200, "text/json",   json);
}