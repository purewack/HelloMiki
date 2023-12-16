#include "server.h"
#include "StringJSON.h"
#include <EEPROM.h>

String saved_ssid;
String saved_psk;

void(*onConnectCallback)(void);
NetState networkState = NET_IDLE;

void networkSignalConnectTo(String ssid, String psk, void(*onConnect)(void)){
    networkState = NET_TRY;
    saved_ssid = ssid;
    saved_psk = psk;
    onConnectCallback = onConnect;
}
void networkSignalBootConnect(void(*onConnect)(void)){
    networkState = NET_BOOT;
    onConnectCallback = onConnect;
}
void networkSignalForget(){

}

int connnectionCounter = false;
unsigned long lastConnectTimeout = 0;    
const char wpaSeparator = ',';

void networkWatchdog(void(*onWifiState)(NetState state)){
    if(networkState == NET_TRY){
        File file = LittleFS.open("private/wpa.txt", "w");
        String wpa = "";
        file.print(saved_ssid);
        file.print(wpaSeparator);
        file.print(saved_psk);
        file.print(wpaSeparator);
        file.close();

        Serial.println("saved creds:");
        Serial.println(saved_ssid);
        Serial.println(saved_psk);

        WiFi.disconnect();
        WiFi.begin(saved_ssid,saved_psk);
        networkState = NET_BUSY;
    }
    else if(networkState == NET_BOOT){
        File wpa = LittleFS.open("private/wpa.txt","r");
        if(wpa){
            {
                char str[32] = {0};
                wpa.readBytesUntil(wpaSeparator,str,32);
                saved_ssid = str;
            }
            {
                char str[32] = {0};
                wpa.readBytesUntil(wpaSeparator,str,32);
                saved_psk = str;
            }
            wpa.close();
            WiFi.disconnect();
            WiFi.begin(saved_ssid,saved_psk);
            networkState = NET_BUSY;

            Serial.println("try connect:");
            Serial.println(saved_ssid);
            Serial.println(saved_psk);
        }
        else{
            networkState = NET_NULL;
            onWifiState(NET_NULL);
            Serial.println("no network chosen");
            if(onConnectCallback) onConnectCallback();
        }
    }
    
    if(networkState == NET_BUSY){
        networkState = NET_CONNECTING;
        connnectionCounter = 0;
        lastConnectTimeout = millis() + 1000;
        onWifiState(NET_CONNECTING);
        Serial.println("try connect: waiting");
    }
    if(networkState == NET_CONNECTING){
        if (WiFi.status() != WL_CONNECTED ) {
            auto now = millis();
            if(now > lastConnectTimeout + 500){
                lastConnectTimeout = now;
                connnectionCounter++;
                if(connnectionCounter >= 30){  
                    networkState = NET_FAIL;
                    onWifiState(NET_FAIL);
                    Serial.println("try connect: fail, removing saved credentials");
                    LittleFS.remove("private/wpa.txt");
                }
            }
        }
        else {
            networkState = NET_OK;
            onWifiState(NET_OK);
            Serial.println("try connect: ok");
            if(onConnectCallback) onConnectCallback();
        }
    }
}

void responseOnSaveNetworkCred(AsyncWebServerRequest* request){
    if(request->hasArg("SSID") && request->hasArg("PSK")){
        auto response = request->beginResponse_P(301, "text/html", "");
        response->addHeader("Location", "/");
        response->addHeader("Cache-Control", "no-cache");
        request->send(response);
        networkSignalConnectTo(request->arg("SSID"),request->arg("PSK"));
    }
}

void responseOnSaveNetworkForget(AsyncWebServerRequest* request){
   
    auto response = request->beginResponse_P(301, "text/html", "");
    response->addHeader("Location", "/");
    response->addHeader("Cache-Control", "no-cache");
    request->send(response);
    networkSignalForget();
    
}

void requestOnNetworkScan(AsyncWebServerRequest* request){
    WiFi.scanNetworksAsync([=](int scanResult){
        String resp_json;
        if (scanResult > 0) {
            JSON_ARRAY(resp_json, 
                for (int8_t i = 0; i < scanResult; i++) {
                    const bss_info *bssInfo = WiFi.getScanInfoByIndex(i);
                    if(i) JSON_NEXT(resp_json);

                    JSON_OBJECT(resp_json, 
                        JSON_KV_STR(resp_json, "ssid", (const char*)bssInfo->ssid);
                            JSON_NEXT(resp_json);
                        JSON_KV(resp_json, "strength", JNUM(bssInfo->rssi));
                            JSON_NEXT(resp_json);
                        JSON_KV(resp_json, "channel", JNUM(bssInfo->channel));
                            JSON_NEXT(resp_json);
                        JSON_KV(resp_json, "wpa", JBOOL(bssInfo->wps));
                    )
                }
            );
            request->send(200, "text/json", resp_json);
        } else {
            request->send(200, "text/json", "[]");
        } 
    });
}

void requestOnStatusNetwork(AsyncWebServerRequest* request){
    String json;
    JSON_OBJECT(json,
        if(WiFi.isConnected()){
            JSON_KV_STR(json,"ssid",WiFi.SSID());
                JSON_NEXT(json);
            JSON_KV(json, "strength", WiFi.RSSI());
        }
    );
    request->send(200, "text/plain", json);
}