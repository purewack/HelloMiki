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
extern char saved_ssid[32];

int connectToWifi(void(*onWait)(void), void(*onOk)(void), void(*onFail)(void), void(*onNoConfig)(void));
void requestOnNetworkScan(AsyncWebServerRequest* request);
void responseOnSaveNetworkCred(AsyncWebServerRequest* request);

void requestOnStatusStorage(AsyncWebServerRequest* request);

void requestOnStatusNetwork(AsyncWebServerRequest* request);