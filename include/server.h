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

#define SERVER_VERSION "H/W/D/3"

extern AsyncWebServer server;
extern AsyncWebSocket ws;
extern AsyncWebSocket wsUpdate;

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
void networkSignalForget();
void networkSignalBootConnect(void(*onConnect)(void) = nullptr);
void networkSignalConnectTo(String ssid, String psk, void(*onConnect)(void) = nullptr);
void networkWatchdog(void(*onWifiState)(NetState state));

void requestOnNetworkScan(AsyncWebServerRequest* request);
void responseOnSaveNetworkCred(AsyncWebServerRequest* request);

void requestOnStatusStorage(AsyncWebServerRequest* request);
void requestOnStatusNetwork(AsyncWebServerRequest* request);

void responseOnTime(AsyncWebServerRequest* request);
void requestOnPastEvents(AsyncWebServerRequest* request);

void requestVersionTag(AsyncWebServerRequest* request);

extern int resetCountdown;
void requestRestart(int inTime = 10000);

void setupUpdateServer();
