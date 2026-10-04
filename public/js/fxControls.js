import {Pane} from "./tweakpane.min.js"; // "https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js";
import {audioNodes} from "./main.js";

const paneContainer = document.querySelector(".audioFXControls");
const canvasContainer = document.querySelector(".audioDisplayContainer");

/**
 * Gets the gain multiplier from a dB value
 * @param {float} gain the dB gain
 * @return the number to multiply to reach that gain
 */
function gainFromdB(gain) {
	return 10 ** (gain / 10.0);
}

let pane = new Pane({container: paneContainer});

/**
 * Change the current audio effect pane to the provided one
 * @param {function} panefunc
 */
function changePane(panefunc) {
	pane.dispose();
	pane = new Pane({container: paneContainer});
	canvasContainer.style.width = "50lvw";
	paneContainer.removeAttribute("hidden");
	panefunc();
	pane.addButton({title: "Hide"}).on("click", hidePane);
}

/**
 * Hide the audio effect pane
 */
function hidePane() {
	paneContainer.setAttribute("hidden", true);
	canvasContainer.style.width = "100lvw";
}

function panPane() {
	pane.title = "Pan betewen ears";
	pane.addBinding(panParams, "pan", {min: -1, max: 1}).label = "L/R";
	const pingPong = pane.addFolder({title: "Ping-pong", expanded: true});
	pingPong.addBinding(panParams, "pingpong").label = "enabled";
	pingPong.addBinding(panParams, "frequency", {min: 0, max: 50});
	pingPong.addBinding(panParams, "amplitude", {min: 0, max: 1});
	pane.on("change", () => {
		const panNodes = audioNodes.panNodes;
		panNodes.pan.pan.value = panParams.pan;
		const pingPong = panNodes.pingPong;
		pingPong.osc.frequency.value = panParams.frequency;
		pingPong.oscGain.gain.value = panParams.pingpong ? panParams.amplitude : 0;
	});
}

function eqPane() {
	pane.title = "Apply lowpass, highpass, and bandpass filters";
	pane.addBinding(eqParams, "enabled");
	pane.addBinding(eqParams, "lowpass", {min: 0, max: 24000}).label = "lowpass (hz)";
	pane.addBinding(eqParams, "highpass", {min: 0, max: 24000}).label = "highpass (hz)";
	const bandpass = pane.addFolder({title: "Bandpass", expanded: true});
	bandpass.addBinding(eqParams.bandpass, "enabled");
	bandpass.addBinding(eqParams.bandpass, "frequency", {min: 0, max: 24000}).label = "frequency (hz)";
	bandpass.addBinding(eqParams.bandpass, "Q", {min: 0}).label = "Q (width)";
	pane.on("change", () => {
		const eqNodes = audioNodes.eqNodes;
		let lowpass = 24000;
		let highpass = 0;
		let Q = -1000;
		if (eqParams.enabled) {
			lowpass = eqParams.lowpass;
			highpass = eqParams.highpass;
		}
		if (eqParams.bandpass.enabled) {
			Q = eqParams.bandpass.Q;
		}
		eqNodes.lowpass.frequency.value = lowpass;
		eqNodes.highpass.frequency.value = highpass;
		eqNodes.bandpass.frequency.value = eqParams.bandpass.frequency;
		eqNodes.bandpass.Q.value = Q;
	});
}

function pitchTempoPane() {
	pane.title = "Change pitch & tempo";
	pane.addBinding(pitchTempoParams, "preservePitch").label = "preserve pitch";
	pane.addBinding(pitchTempoParams, "playbackRate", {min: 0, max: 16}).label = "playback rate";
	pane.on("change", () => {
		const audioPlr = audioNodes.audioPlr;
		audioPlr.preservesPitch = pitchTempoParams.preservePitch;
		audioPlr.playbackRate = pitchTempoParams.playbackRate;
	});
}

function bitcrusherPane() {
	pane.title = "Distiortion through limiting sample bits";
	pane.addBinding(bitcrusherParams, "enabled");
	pane.addBinding(bitcrusherParams, "preGain", {min: -10, max: 40}).label = "pre gain (db)";
	pane.addBinding(bitcrusherParams, "bits", {min: 1, max: 16});
	pane.addBinding(bitcrusherParams, "postGain", {min: -40, max: 10}).label = "post gain (db)";
	pane.on("change", () => {
		const bitcrusherNodes = audioNodes.bitcrusherNodes;
		let bits = 16;
		let preGain = 1;
		let postGain = 1;
		if (bitcrusherParams.enabled) {
			bits = bitcrusherParams.bits;
			preGain = gainFromdB(bitcrusherParams.preGain);
			postGain = gainFromdB(bitcrusherParams.postGain);
		}
		bitcrusherNodes.bitcrusher.parameters.get("bits").value = bits;
		bitcrusherNodes.preGain.gain.value = preGain;
		bitcrusherNodes.postGain.gain.value = postGain;
	});
}

function distortionPane() {
	pane.title = "Distortion through clipping";
	pane.addBinding(distortionParams, "enabled");
	pane.addBinding(distortionParams, "drive", {min: 0, max: 40}).label = "drive (db)";
	pane.addBinding(distortionParams, "gain", {min: -40, max: 10}).label = "post gain (db)";
	const compression = pane.addFolder({title: "compressor", expanded: true});
	compression.addBinding(distortionParams, "threshold", {min: -60, max: 0}).label = "threshold (dB)";
	compression.addBinding(distortionParams, "knee", {min: 0, max: 40}).label = "knee (dB)";
	compression.addBinding(distortionParams, "ratio", {min: 1, max: 20}).label = "ratio (1:n reduction)";
	pane.on("change", () => {
		const distortionNodes = audioNodes.distortionNodes;
		let driveGain = 1;
		let postGain = 1;
		let threshold = 0;
		let ratio = 1;
		if (distortionParams.enabled) {
			driveGain = gainFromdB(distortionParams.drive);
			postGain = gainFromdB(distortionParams.gain);
			threshold = distortionParams.threshold;
			ratio = distortionParams.ratio;
		}
		distortionNodes.drive.gain.value = driveGain;
		// distortionNodes.normalize.gain.value = 1 / driveGain;
		distortionNodes.postGain.gain.value = postGain;
		distortionNodes.compressor.threshold.value = threshold;
		distortionNodes.compressor.knee.value = distortionParams.knee;
		distortionNodes.compressor.ratio.value = ratio;
	});
}

function echoPane() {
	pane.title = "Echo effect";
	pane.addBinding(echoParams, "enabled");
	pane.addBinding(echoParams, "delay", {min: 0, max: 10000}).label = "delay (ms)";
	pane.addBinding(echoParams, "feedback", {min: 0, max: 1});
	pane.on("change", () => {
		const echoNodes = audioNodes.echoNodes;
		let feedback = 0;
		if (echoParams.enabled) {
			feedback = echoParams.feedback;
		}
		echoNodes.delay.delayTime.value = echoParams.delay / 1000;
		echoNodes.feedback.gain.value = feedback;
	});
}

function stereoDifferencePane() {
	pane.title = "Output only the difference between L and R channels";
	pane.addBinding(stereoDifferenceParams, "enabled");
	pane.addBinding(stereoDifferenceParams, "postGain", {min: -10, max: 40}).label = "post gain (db)";
	pane.on("change", () => {
		const stereoDiffNodes = audioNodes.stereoDiffNodes;
		const stereoDiff = stereoDiffNodes.stereoDiff;
		stereoDiff.parameters.get("passthrough").value = !stereoDifferenceParams.enabled;
		const postGain = stereoDiffNodes.postGain;
		postGain.gain.value = gainFromdB(stereoDifferenceParams.postGain);
	});
}

document.querySelector("#panBtn").addEventListener("click", () => changePane(panPane));
document.querySelector("#EQBtn").addEventListener("click", () => changePane(eqPane));
document.querySelector("#pitchTempoBtn").addEventListener("click", () => changePane(pitchTempoPane));
document.querySelector("#bitcrusherBtn").addEventListener("click", () => changePane(bitcrusherPane));
document.querySelector("#distortionBtn").addEventListener("click", () => changePane(distortionPane));
document.querySelector("#echoBtn").addEventListener("click", () => changePane(echoPane));
document.querySelector("#stereoDiffBtn").addEventListener("click", () => changePane(stereoDifferencePane));

const panParams = {
	pan: 0.0,
	pingpong: false,
	frequency: 2,
	amplitude: 0.5,
};

const eqParams = {
	enabled: false,
	lowpass: 24000,
	highpass: 0,
	bandpass: {
		enabled: false,
		frequency: 8000,
		Q: 0.5,
	},
};

const pitchTempoParams = {
	preservePitch: true,
	playbackRate: 1,
};

const bitcrusherParams = {
	enabled: false,
	preGain: 0,
	bits: 16,
	postGain: 0,
};

const distortionParams = {
	enabled: false,
	drive: 0,
	gain: 0,
	threshold: 0,
	knee: 0,
	ratio: 20,
};

const echoParams = {
	enabled: false,
	delay: 150,
	feedback: 0.4,
};

const stereoDifferenceParams = {
	enabled: false,
	postGain: 0,
};

window.addEventListener("load", () => hidePane());
