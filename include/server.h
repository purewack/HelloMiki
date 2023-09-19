#pragma once
#include <Arduino.h>

#include <LittleFS.h>

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>

#include <WiFiClient.h>
#include <ESP8266mDNS.h>
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebSrv.h>
 
extern AsyncWebServer server;
extern AsyncWebSocket ws;

extern double timeOffset;
extern double timeWhenSet;

enum NetState {
    NET_IDLE,
    NET_BUSY,
    NET_CONNECTING,
    NET_TRY,
    NET_BOOT,
    NET_OK,
    NET_FAIL,
    NET_NULL
};
void networkSignalBootConnect();
void networkSignalForget();
void networkSignalConnectTo(String ssid, String psk);
void networkWatchdog(void(*onWifiState)(NetState state));

void requestOnNetworkScan(AsyncWebServerRequest* request);
void responseOnSaveNetworkCred(AsyncWebServerRequest* request);

void requestOnStatusStorage(AsyncWebServerRequest* request);
void requestOnStatusNetwork(AsyncWebServerRequest* request);

void responseOnUTCTimeOffsetPost(AsyncWebServerRequest* request);
void requestOnPastEvents(AsyncWebServerRequest* request);

void setupUpdateServer();
