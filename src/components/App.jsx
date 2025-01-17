import "./App.css";
import React, { useState } from "react";
import PitchGraph from "./PitchGraph";
import Spectrum from "./Spectrum";
import autoCorrelate from "../utils/autoCorrelate";

function App () {
	let [freq, useFreq] = useState(0);
	let [analyserProp, useAnalyserProp] = useState(null);
	// let [showSpectrum, useShowSpectrum] = useState(false);
	let [showSpectrum, useShowSpectrum] = useState(true);
	let [spacing, useSpacing] = useState("small");
	let [range, useRange] = useState("low");
	let [accidentals, useAccidentals] = useState("sharp");

	function checkSpectrum (event) {
		useShowSpectrum(event.target.checked);
	}

	function noteIsSimilarEnough (
		valueToDisplay,
		previousValueToDisplay,
		smoothingThreshold
	) {
		// Check threshold for number, or just difference for notes.
		if (typeof valueToDisplay == "number") {
			return (
				Math.abs(valueToDisplay - previousValueToDisplay) <
				smoothingThreshold
			);
		} else {
			return valueToDisplay === previousValueToDisplay;
		}
	}

	function visualize (analyser, audioContext) {
		var previousValueToDisplay = 0;
		var smoothingCount = 0;
		var smoothingThreshold = 10;
		var smoothingCountThreshold = 0;

		function draw () {
			requestAnimationFrame(draw);
			var bufferLength = analyser.fftSize;
			var buffer = new Float32Array(bufferLength);
			analyser.getFloatTimeDomainData(buffer);
			var autoCorrelateValue = autoCorrelate(
				buffer,
				audioContext.sampleRate
			);

			// Handle rounding
			var valueToDisplay = autoCorrelateValue;

			if (autoCorrelateValue === -1) {
				return -1;
			}

			// Check if this value has been within the given range for n iterations
			if (
				noteIsSimilarEnough(
					valueToDisplay,
					previousValueToDisplay,
					smoothingThreshold
				)
			) {
				if (smoothingCount < smoothingCountThreshold) {
					smoothingCount++;
					return;
				} else {
					previousValueToDisplay = valueToDisplay;
					smoothingCount = 0;
				}
			} else {
				previousValueToDisplay = valueToDisplay;
				smoothingCount = 0;
				return;
			}
			console.log('valueToDisplay: ', valueToDisplay)
			useFreq(valueToDisplay.toFixed(2));
		}

		draw();
	}

	function record () {
		// Declare the media stream and microphone variables
		let source = null;
		let mediaStream = null;
		let microphone = null;

		// Define a function to start the microphone
		function startMicrophone () {
			// Check if the media stream is active
			if (mediaStream && !microphone) {
				// Get the audio track from the media stream
				const audioTrack = mediaStream.getAudioTracks()[0];
				// Create a new media stream with just the audio track
				microphone = new MediaStream([audioTrack]);
			}
		}

		// Define a function to stop the microphone
		function stopMicrophone () {
			// Check if the microphone is active
			if (microphone) {
				// Stop the microphone
				microphone.getAudioTracks().forEach((track) => track.stop());
				microphone = null;
			}
		}

		// Check if getUserMedia is supported
		if (!navigator?.mediaDevices?.getUserMedia) {
			// No audio allowed
			console.log(navigator);
			alert("Sorry, getUserMedia is required for the app.");
			return;
		} else {
			var constraints = { audio: true };
			navigator.mediaDevices
				.getUserMedia(constraints)
				.then((stream) => {
					// Set the media stream
					mediaStream = stream;
					// Start the microphone when the app is in focus
					window.addEventListener("focus", startMicrophone);
					// Stop the microphone when the app is not in focus
					window.addEventListener("blur", stopMicrophone);
					// Start the microphone
					startMicrophone();
					// Create the audio context and analyser
					var audioContext = new (window.AudioContext ||
						window.webkitAudioContext)();
					var analyser = audioContext.createAnalyser();
					// Set the analyser properties
					analyser.minDecibels = -100;
					analyser.maxDecibels = -10;
					analyser.smoothingTimeConstant = 0.85;
					// Connect the source to the analyser
					source = audioContext.createMediaStreamSource(microphone);
					source.connect(analyser);
					useAnalyserProp(analyser);
					visualize(analyser, audioContext);
				})
				.catch((err) => {
					console.log(err);
					alert(
						"Sorry, microphone permissions are required for the app"
					);
				});
		}
	}

	function handleSpacingChange (event) {
		useSpacing(event.target.value);
	}

	function handleRangeChange (event) {
		useRange(event.target.value);
	}

	function handleAccidentalsChange (event) {
		useAccidentals(event.target.value);
	}

	return (
		// white
		<div className="flex flex-col text-dark">
			<div className="flex flex-col pb-2">
				<button className="py-1" onClick={record}>
					<span className="hover:text-red-600">Start（开始）</span>
				</button>
				<div className="py-2 font-bold">{freq}</div>
				<div className="text-xs py-2">
					<label htmlFor="accidentals-select" className="ml-4">
					Accidentals（描述符号）:
					</label>
					<select
						id="accidentals-select"
						value={accidentals}
						onChange={handleAccidentalsChange}
						className="ml-2 mr-4 border rounded-sm bg-slate-800 border-slate-600 bg-white"
					>
						<option value="sharp">#</option>
						<option value="flat">b</option>
						<option value="both">#/b</option>
					</select>
					{/* <label htmlFor="spacing-select" className="ml-4">
						range:
					</label>
					<select
						id="range-select"
						value={range}
						onChange={handleRangeChange}
						className="ml-2 mr-4 border rounded-sm bg-slate-800 border-slate-600 bg-white"
					>
						<option value="low">low</option>
						<option value="high">high</option>
					</select> */}
					<label htmlFor="spacing-select" className="ml-4">
					Spacing（间距）:
					</label>
					<select
						id="spacing-select"
						value={spacing}
						onChange={handleSpacingChange}
						className="ml-2 mr-4 border rounded-sm bg-slate-800 border-slate-600 bg-white"
					>
						<option value="small">small 小</option>
						<option value="medium">medium 中</option>
						<option value="large">large 大</option>
					</select>
					<label className="mx-4">
					Spectrum（光谱仪）:
						<input
							type="checkbox"
							checked={showSpectrum}
							onChange={checkSpectrum}
							className="ml-2"
						/>
					</label>
				</div>
			</div>
			{showSpectrum && <Spectrum analyser={analyserProp} />}
			<PitchGraph
				frequency={freq}
				spacing={spacing}
				range={range}
				accidentals={accidentals}
			/>
		</div>
	);
}

export default App;
