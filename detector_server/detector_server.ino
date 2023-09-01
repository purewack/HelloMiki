#include "hardware.h"
#include "monitor.h"
#include "server.h"
Adafruit_SH1106G display = Adafruit_SH1106G(128, 64, &Wire, -1);
ESP8266WebServer server(80);
char saved_ssid[32];

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

  WiFi.mode(WIFI_AP_STA);
  WiFi.disconnect();
  WiFi.softAP("hellomiki_config","letmein");

  display.clearDisplay();
  display.setCursor(0,0);
  display.setTextSize(1);

  LittleFS.begin();
  
  display.println("WiFi Connecting");
  auto wifiWaitDisplay = [](){
    display.print(".");
    display.display();
  };
  auto wifiOkDisplay = [](){
    display.clearDisplay();
    display.setCursor(0,0);
    display.setTextSize(1);
      
      display.println("Hello Miki!");
      display.println("");

      display.println("Connected :)");
      display.println("");

      display.println(saved_ssid);
      display.println("IP:");
      display.print(" > ");
      display.println(WiFi.localIP());
    display.display();
  };
  auto wifiFailDisplay = [](){
    display.clearDisplay();
    display.setCursor(0,0);
    display.setTextSize(1);
      
      display.println("Hello Miki!");
      display.println("");

      display.println("Wifi Failed :O");
      display.println("");

      display.println("Config IP:");
      display.print(" > ");
      display.println(WiFi.softAPIP());
    display.display();
    WiFi.disconnect();
  };
  connectToWifi(wifiWaitDisplay, wifiOkDisplay, wifiFailDisplay, [](){
    display.clearDisplay();
    display.setCursor(0,0);
    display.setTextSize(1);
      
      display.println("Hello Miki!");
      display.println("");

      display.println("WiFi unconfigured");
      display.println("");


      display.println("Direct Access IP:");
      display.print(" > ");
      display.println(WiFi.softAPIP());

    display.display();
  });

  MDNS.begin("hellomiki");
  MDNS.addService("http", "tcp", 80);
  
  server.enableCORS(true);
  server.onNotFound(notFoundHandle);
  server.on("/", onRootHandle);

  server.on("/scan", isPresentHandle);

  // server.on("/private/*", forbiddenHandle);
  server.on("/network", onNetworkScanRequestHandle); 
  server.on("/network/select", [=](){
    onNetworkChooseHandle();
    display.clearDisplay();
    display.setCursor(0,0);
    display.println("Trying Wifi");
    connectToWifi(wifiWaitDisplay, wifiOkDisplay, wifiFailDisplay, nullptr);
  });
  server.begin();

}
void forbiddenHandle(){
  server.send(403, "text/plain", "Forbidden access");
}
void notFoundHandle(){
  String uri = ESP8266WebServer::urlDecode(server.uri());  // required to read paths with blanks
  if(!fileRequestHandle(uri))
    server.send(404, "text/plain", "File not found");
}
void onRootHandle(){
  if(!fileRequestHandle("index.html"))
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
  // updateMonitor();

  // if(didEnterPresence()){
  //   display.clearDisplay();
  //   display.setCursor(0,0);
  //   display.setTextSize(4);
  //   display.println("Meow");
  //   display.display();
  // }
  // else if(didLeavePresence()){
  //   display.clearDisplay();
  //   display.setCursor(0,0);
  //   display.setTextSize(2);
  //   display.println("Scanning..");
  //   display.display();
  // }
  
  server.handleClient();
  MDNS.update();
}
