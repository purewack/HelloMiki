#define PIN_LED D4
#define PIN_DRIVE D5
#define PIN_SENSE D6

void setup() {
  Serial.begin(19200);

  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_DRIVE, OUTPUT);
  pinMode(PIN_SENSE, INPUT);

}

unsigned long time_dt;
void loop() {
  digitalWrite(PIN_LED,0);
  //cahrge up
  digitalWrite(PIN_DRIVE, HIGH);
  delay(1);

  //measure time
  time_dt = 0;
  digitalWrite(PIN_DRIVE, LOW);
  while(digitalRead(PIN_SENSE) && time_dt < 10000){
    time_dt++;
    delayMicroseconds(5);
  }
  if(time_dt > 100){
    digitalWrite(PIN_LED,1);
    Serial.println(time_dt);
    delay(50);
  }
}
