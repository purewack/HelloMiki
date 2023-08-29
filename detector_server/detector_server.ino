#include "hardware.h"
#include "monitor.h"
#include "server.h"
#include <LittleFS.h>
Adafruit_SH1106G display = Adafruit_SH1106G(128, 64, &Wire, -1);
ESP8266WebServer server(80);

#include "secret.h"
const char* ssid = SSID_NAME_SECRET;
const char* password = SSID_PWD_SECRET;


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

  LittleFS.begin();
  
  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(ssid, password);
  WiFi.softAP("hellomiki","letmein");
 
  display.clearDisplay();
  display.setCursor(0,0);
  display.setTextSize(1);
  display.println("Connecting");
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED) {
    tries++;
    if(tries > 30){
      display.clearDisplay();
      display.setCursor(0,0);
      display.println("WiFi connection failed :(");
      display.println("Configure network");
      display.display();
      delay(5000);
      break;
    }
    delay(500);
    display.print(".");
    display.display();
  }
  display.clearDisplay();
  display.setCursor(0,0);
  display.setTextSize(1);
    
    display.println("Hello Miki!");
    display.println("");

    display.println("LAN IP:");
    display.print(" > ");
    display.println(WiFi.localIP());
    display.println("");

    display.println("Direct Access IP:");
    display.print(" > ");
    display.println(WiFi.softAPIP());

  display.display();

  MDNS.begin("hellomiki");
  MDNS.addService("http", "tcp", 80);
  
  server.enableCORS(true);
  server.on("/scan", HTTP_GET, isPresentHandle);
  server.on("/network", HTTP_GET, onNetworkScanRequestHandle); 
  server.on("/", HTTP_GET, onRootHandle);
  server.onNotFound(notFoundHandle);
  server.begin();

}

void notFoundHandle(){
  String uri = ESP8266WebServer::urlDecode(server.uri());  // required to read paths with blanks
  if(!fileRequestHandle(uri))
    server.send(404, "text/plain", "File not found");
}
void onRootHandle(){
  if(!fileRequestHandle("/index.html"))
    server.send(404, "text/plain", "File not found");
}


bool fileRequestHandle(String path) {
  String contentType;
  if (server.hasArg("download")) {
    contentType = F("application/octet-stream");
  } else {
    contentType = mime::getContentType(path);
  }

  if (LittleFS.exists(path)) {
    File file = LittleFS.open(path, "r");
    server.streamFile(file, contentType);
    file.close();
    return true;
  }

  return false;
}

void loop() {
  updateMonitor();

  if(didEnterPresence()){
    display.clearDisplay();
    display.setCursor(0,0);
    display.setTextSize(4);
    display.println("Meow");
    display.display();
  }
  else if(didLeavePresence()){
    display.clearDisplay();
    display.setCursor(0,0);
    display.setTextSize(2);
    display.println("Scanning..");
    display.display();
  }
  
  delay(100);
  server.handleClient();
  MDNS.update();
}
