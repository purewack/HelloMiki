import React, { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

export default function WebcamCatDetection(){
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [ready, setReady] = useState(false)

  useEffect(() => {
    const initWebcam = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Explicitly set the backend to WebGL
      await tf.setBackend('webgl');

      // Load the Coco-ssd model
      const model = await cocoSsd.load();

      // Access webcam stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        setReady(true);
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }

      // Wait for the video to start playing
      video.addEventListener('loadeddata', async () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Perform real-time cat detection
        setInterval(async () => {
          const predictions = await detectCats(model, video);

          // Draw bounding boxes on the canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          predictions.forEach(prediction => {
            const box = prediction.bbox;
            const [x, y, width, height] = box;

            // Scale coordinates to match canvas dimensions
            const scaleX = canvas.width / video.videoWidth;
            const scaleY = canvas.height / video.videoHeight;

            // Adjust bounding box coordinates
            const scaledX = x * scaleX;
            const scaledY = y * scaleY;
            const scaledWidth = width * scaleX;
            const scaledHeight = height * scaleY;

            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
          });
        }, 100); // Adjust the interval based on your preference
      });
    };

    const detectCats = async (model, video) => {
      // Capture a frame from the video
      const image = tf.browser.fromPixels(video);

      // Make predictions
      const predictions = await model.detect(image);

      // Filter predictions to get only cat detections
      const catPredictions = predictions.filter(obj => obj.class === 'cat');

      return catPredictions;
    };

    initWebcam();
  }, []); // Empty dependency array means this effect runs once when the component mounts

  return (<>
    <p>{ready ? 'Done' : '...Loading'}</p>
    <div style={{display: 'grid', gridTemplateArea: 'sense'}}>
      <video ref={videoRef} style={{gridArea: "sense"}} id="webcam" width="640" height="480" autoPlay></video>
      <canvas ref={canvasRef} style={{gridArea: "sense", border: "solid red 1px"}} id="outputCanvas" width="640" height="480"></canvas>
    </div>
  </>);
}