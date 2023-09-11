#include "server.h"
#include "StringJSON.h"
#include <EEPROM.h>

String saved_ssid;
String saved_psk;

int networkSignal = 0;
void networkSignalConnectTo(String ssid, String psk){
    networkSignal = 1;
    saved_ssid = ssid;
    saved_psk = psk;
}
void networkSignalBootConnect(){
    networkSignal = 2;
}
void networkSignalForget(){

}

int isConnecting = false;
unsigned long lastConnectTimeout = 0;    
const char wpaSeparator = ',';

void networkWatchdog(void(*onWait)(void), void(*onOk)(void), void(*onFail)(void)){
    if(networkSignal == 1){
        networkSignal = 0;
        File file = LittleFS.open("private/wpa.txt", "w");
        String wpa = "";
        file.print(saved_ssid);
        file.print(wpaSeparator);
        file.print(saved_psk);
        file.print(wpaSeparator);
        file.close();

        WiFi.disconnect();
        WiFi.begin(saved_ssid,saved_psk);
        isConnecting = 1;
    }
    else if(networkSignal == 2){
        networkSignal = 0;
        Serial.println("connect 2");
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
            isConnecting = 1;
        }
        else{
            isConnecting = false;
            if(onFail) onFail();
        }
    }
    
    if(isConnecting){
        if (WiFi.status() != WL_CONNECTED ) {
            auto now = millis();
            if(now > lastConnectTimeout + 500){
                lastConnectTimeout = now;
                isConnecting++;
                if(isConnecting >= 30){
                    isConnecting = false;
                    if(onFail) onFail();
                }
                if(onWait) onWait();
            }
        }
        else {
            if(onOk) onOk();
            isConnecting = false;
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
    if(request->hasArg("SSID") && request->hasArg("PSK")){
        auto response = request->beginResponse_P(301, "text/html", "");
        response->addHeader("Location", "/");
        response->addHeader("Cache-Control", "no-cache");
        request->send(response);
        networkSignalForget();
    }
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