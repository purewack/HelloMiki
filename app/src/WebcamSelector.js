import React, { useState, useEffect } from 'react';

const WebcamSelector = ({ onSelect }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    const getMediaDevices = async () => {
      try {
        const devicesInfo = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devicesInfo.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);

        // If there's only one device, select it by default
        setSelectedDevice(videoDevices.length === 1 ? videoDevices[0] : null);
      } catch (error) {
        console.error('Error enumerating media devices:', error);
      }
    };

    getMediaDevices();
  }, []);

  const handleDeviceClick = (deviceId) => {
    const selected = devices.find(device => device.deviceId === deviceId);
    setSelectedDevice(selected);
    onSelect(selected);
  };

  return (
    <div>
      <p>Select Webcam:</p>
      <ul>
        {devices.map(device => (
          <li key={device.deviceId} style={{ cursor: 'pointer' }}>
            <button onClick={() => handleDeviceClick(device.deviceId)} >{device.label || `Webcam ${devices.indexOf(device) + 1} : ${devices.deviceId}`}</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WebcamSelector;
