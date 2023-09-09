#pragma once

#define PIN_ZONE_HOME_HU_ENT

struct SensorPort{
    int pin = -1;
    bool invert = 0;
};

struct Sensor {
    int id = -1;
    int type = -1;
    bool omit = 1;
    SensorPort port;
    bool poll();
};

struct SensorZone {
    char* zone = "default";
    Sensor triggerEnter;
    Sensor triggerExit;
    Sensor triggerCancel;
    bool mono = 0;
    bool reverseTriggerDirection = 0;

    int poll();
    String toJSON();
};

extern SensorZone zones[2];
void setupZonePins();
void pollZones();
void inspectPollZonesBlocking();

void updateMonitor();
bool didEnterPresence();
bool didLeavePresence();