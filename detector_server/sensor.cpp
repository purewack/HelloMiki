#include "sensor.h"
#include <Arduino.h>


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

void SensorZone::list(){
    Serial.println("Sensor Group {");
        Serial.print("zone: "); Serial.println(zone);
        Serial.print("reverse: "); Serial.println(reverseTriggerDirection);

        auto listTrigger = [](auto trigger){
            Serial.print("id: "); Serial.println(trigger.id);
            Serial.print("type: "); Serial.println(trigger.type);
            Serial.print("port_pin: "); Serial.println(trigger.port.pin);
            Serial.print("port_invert: "); Serial.println(trigger.port.invert);
        };

        Serial.println("presence: {");  
            listTrigger(presence);
        Serial.println("}"); 

        Serial.println("triggerEnter: {");  
            listTrigger(triggerEnter);
        Serial.println("}"); 

        Serial.println("triggerEnterHuman: {");  
            listTrigger(triggerEnterHuman);
        Serial.println("}"); 

        Serial.println("triggerExit: {");  
            listTrigger(triggerExit);
        Serial.println("}"); 

        Serial.println("triggerExitHuman: {");  
            listTrigger(triggerExitHuman);
        Serial.println("}"); 
    Serial.println("}"); 
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
            Serial.print("presence"); Serial.println(zone.presence.poll());
            Serial.print("triggerEnter"); Serial.println(zone.triggerEnter.poll());
            Serial.print("triggerEnterHuman"); Serial.println(zone.triggerEnterHuman.poll());
            Serial.print("triggerExit"); Serial.println(zone.triggerExit.poll());
            Serial.print("triggerExitHuman"); Serial.println(zone.triggerExitHuman.poll());
        Serial.println("}");
    }
    Serial.println("}");
}