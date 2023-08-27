#define PIN_LED D4
#define PIN_SPEAK D5
#define PIN_SENSE D6

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
Adafruit_SH1106G display = Adafruit_SH1106G(128, 64, &Wire, -1);


#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include "secret.h"
 
const char* ssid = SSID_NAME_SECRET;
const char* password = SSID_PWD_SECRET;

ESP8266WebServer server(80);
void notFoundHandle();
void isPresentHandle();

void setup() {
  Serial.begin(19200);
  display.begin(0x3C, true); // Address 0x3C default
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.display();

  // Clear the buffer.
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_SENSE, INPUT);
  pinMode(PIN_SPEAK, OUTPUT);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
 
  display.clearDisplay();
  display.setCursor(0,0);
  display.setTextSize(1);
  display.println("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    display.print(".");
    display.display();
  }
  display.clearDisplay();
  display.setCursor(0,0);
  display.setTextSize(1);
  display.println("Hello Miki!");
  display.display();

  MDNS.begin("hellomiki");
  MDNS.addService("http", "tcp", 80);
  
  server.enableCORS(true);
  server.on("/ispresent", HTTP_GET, isPresentHandle);
  server.onNotFound(notFoundHandle);
  server.begin();
}


bool meow = false;
bool meowOld = false;

void notFoundHandle(){
  server.send(404, "text/plain", "URI not found");
}
void isPresentHandle(){
  server.send(200, "text/json", meow ? "{\"isPresent\":true}" : "{\"isPresent\":false}");
}

void loop() {
  meowOld = meow;
  meow = digitalRead(PIN_SENSE);

  if(meow && !meowOld){
    display.clearDisplay();
    display.setCursor(0,0);
    display.setTextSize(4);
    display.println("Meow");
    display.display();

    // for(int i=0; i<10; i++){
    //   for(int j=0; j<500; j++){
    //     digitalWrite(PIN_SPEAK,1);
    //     delayMicroseconds(500);
    //     digitalWrite(PIN_SPEAK,0);
    //     delayMicroseconds(500);
    //   }
    //   delay(250);
    // }
  }
  else if(!meow && meowOld){
    display.clearDisplay();
    display.setCursor(0,0);
    display.setTextSize(2);
    display.println("Scanning..");
    display.display();
  }
  
  delay(300);
  server.handleClient();
  MDNS.update();
}
