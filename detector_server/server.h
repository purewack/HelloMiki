#pragma once
#include <Arduino.h>

#include <LittleFS.h>

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>

#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
 
extern ESP8266WebServer server;
extern char saved_ssid[32];

int connectToWifi(void(*onWait)(void), void(*onOk)(void), void(*onFail)(void), void(*onNoConfig)(void));
void onNetworkScanRequestHandle();
void onNetworkChooseHandle();
void forbiddenHandle();
void notFoundHandle();
void isPresentHandle();
bool fileRequestHandle();
void onRootHandle();