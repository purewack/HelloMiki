#include "server.h"
#include "StringJSON.h"

int connectToWifi(void(*onWait)(void), void(*onOk)(void), void(*onFail)(void), void(*onNoConfig)(void)){
	File wpa = LittleFS.open("private/wpa.txt","r");
	if(wpa){
		char saved_psk[32] = {0};
		wpa.readBytesUntil(',',saved_ssid,32);
		wpa.readBytesUntil(',',saved_psk,32);
		Serial.println("--");
		Serial.println(saved_ssid);
		Serial.println(saved_psk);
		Serial.println("--");
		wpa.close();
		WiFi.disconnect();
		WiFi.begin(saved_ssid,saved_psk);

		int tries = 0;
		int try_count = 15;
		while (WiFi.status() != WL_CONNECTED ) {
			tries++;
			if(tries >= try_count){
				if(onFail) onFail();
				return -1;
			}
			if(onWait) onWait();
			delay(500);
		}
		if(onOk) onOk();
		return 1;
	}

	if(onNoConfig) onNoConfig();
	return 0;
}

void onNetworkChooseHandle(){
    if(server.hasArg("SSID") && server.hasArg("PSK")){
        File file = LittleFS.open("private/wpa.txt", "w");
        String wpa = "";
        file.print(server.arg("SSID"));
        file.print(',');
        file.print(server.arg("PSK"));
        file.print(',');
        file.close();
        server.sendHeader("Location", "/");
        server.sendHeader("Cache-Control", "no-cache");
        server.send(301);
    }
}

void onNetworkScanRequestHandle(){
    String resp_json;
    int scanResult;

    scanResult = WiFi.scanNetworks(/*async=*/false, /*hidden=*/false);

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
        server.send(200, "text/json", resp_json);
    } else {
        server.send(200, "text/json", "[]");
    } 
}
