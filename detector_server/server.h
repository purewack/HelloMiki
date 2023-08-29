#include <Arduino.h>

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>

#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
 
extern ESP8266WebServer server;

void onNetworkScanRequestHandle();
void notFoundHandle();
void isPresentHandle();
bool fileRequestHandle();
void onRootHandle();
