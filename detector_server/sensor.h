#pragma once

struct SensorPort{
    int pin;
    bool invert;
};

struct Sensor {
    int id;
    int type;
    bool omit;
    SensorPort port;
    bool poll();
};

struct SensorZone {
    char* zone;
    Sensor presence;
    Sensor triggerEnter;
    Sensor triggerEnterHuman;
    Sensor triggerExit;
    Sensor triggerExitHuman;
    bool reverseTriggerDirection;

    void list();
    int poll();
};

extern SensorZone zones[2];
void setupZonePins();
void pollZones();
void inspectPollZonesBlocking();