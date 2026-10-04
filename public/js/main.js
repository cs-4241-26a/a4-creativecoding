const audioPlr = document.querySelector(".audioPlayerContainer").querySelector("audio");
audioPlr.src = "./audio/Carefree.mp3";

const canvas = document.querySelector(".audioDisplayContainer").querySelector("canvas");
const canvasCtx = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 256;
canvasCtx.fillStyle = "#13171f";
canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

/** @type {AudioContext} */
let audioCtx;

export let audioNodes = {
	audioPlr,
	playerNode: {},
	panNodes: {},
	eqNodes: {},
	bitcrusherNodes: {},
	distortionNodes: {},
	echoNodes: {},
	stereoDiffNodes: {},
};

async function start() {
	audioCtx = new AudioContext();
	await audioCtx.audioWorklet.addModule("./js/audioProcessors.js");

	const analyser = audioCtx.createAnalyser(); // british spelling!
	analyser.fftSize = 2048; // 1024 bins
	analyser.smoothingTimeConstant = 0.6;
	const bufferLength = analyser.frequencyBinCount;

	canvas.width = bufferLength;
	canvas.height = 256;

	const outputNode = effectPipeline();
	outputNode.connect(audioCtx.destination);
	outputNode.connect(analyser);
	const results = new Uint8Array(bufferLength);
	function draw() {
		window.requestAnimationFrame(draw);

		// Clear canvas
		canvasCtx.fillStyle = "#10141b";
		canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
		canvasCtx.fillStyle = "white";

		analyser.getByteFrequencyData(results);
		for (let i = 0; i < bufferLength; i++) {
			canvasCtx.fillRect(i, canvas.height - results[i], 1, results[i]);
		}
	}

	draw();
}

window.onclick = () => {
	start();
	audioPlr.style.pointerEvents = "all";
	window.onclick = null;
};

let inputAudioUrl;

const audioFileInput = document.querySelector("#audioFileInput");
audioFileInput.addEventListener("change", () => {
	const file = audioFileInput.files[0];
	if (!file) {
		return;
	}
	if (inputAudioUrl) {
		URL.revokeObjectURL(inputAudioUrl);
	}
	inputAudioUrl = URL.createObjectURL(file);
	audioPlr.src = inputAudioUrl;
	audioPlr.load();
	audioPlr.play();
});

const audioSelector = document.querySelector("#audioSelector");
audioSelector.addEventListener("change", () => {
	const selected = audioSelector.value;
	if (selected === "upload") {
		audioFileInput.removeAttribute("hidden");
		audioPlr.src = inputAudioUrl;
	} else {
		audioFileInput.setAttribute("hidden", true);
		audioPlr.src = `./audio/${selected}`;
		audioPlr.play();
	}
});

/**
 * Applies all enabled effects to the played audio
 * @returns an AudioNode that can be connected to audio output
 */
function effectPipeline() {
	const player = audioCtx.createMediaElementSource(audioPlr);
	audioNodes.playerNode = player;
	const panned = panNodes(player);
	const eq = eqNodes(panned);
	const bitcrusher = bitcrusherNodes(eq);
	const distortion = distortionNodes(bitcrusher);
	const echo = echoNodes(distortion);
	const stereoDiff = stereoDiffNodes(echo);
	return stereoDiff;
}

/**
 * Apply the pan and ping-pong effect and add the used nodes to audioNodes
 * @param {AudioNode} inputNode a node to apply the effects to
 * @returns an AudioNode with the pan and ping-pong effects applied
 */
function panNodes(inputNode) {
	const pan = audioCtx.createStereoPanner();
	inputNode.connect(pan);
	const pingPong = audioCtx.createStereoPanner();
	const osc = audioCtx.createOscillator();
	const oscGain = audioCtx.createGain();
	pan.connect(pingPong);
	osc.frequency.value = 0.25;
	oscGain.gain.value = 0;
	osc.start();
	osc.connect(oscGain);
	oscGain.connect(pingPong.pan);
	audioNodes.panNodes = {
		pan,
		pingPong: {
			stereoPanner: pingPong,
			osc,
			oscGain,
		},
	};
	return pingPong;
}

/**
 * Apply the eq effect and add the used nodes to audioNodes
 * @param {AudioNode} inputNode a node to apply the effects to
 * @returns an AudioNode with the eq effects applied
 */
function eqNodes(inputNode) {
	const lowpass = new BiquadFilterNode(audioCtx, {
		type: "lowpass",
		frequency: 24000,
	});
	const highpass = new BiquadFilterNode(audioCtx, {
		type: "highpass",
		frequency: 0,
	});
	const bandpass = new BiquadFilterNode(audioCtx, {
		type: "bandpass",
		frequency: 8000,
		Q: -100,
	});
	inputNode.connect(lowpass);
	lowpass.connect(highpass);
	highpass.connect(bandpass);
	audioNodes.eqNodes = {
		lowpass,
		highpass,
		bandpass,
	};
	return bandpass;
}

/**
 * Apply the bitcrusher effect and add the used nodes to audioNodes
 * @param {AudioNode} inputNode a node to apply the effects to
 * @returns an AudioNode with the bitcrusher effects applied
 */
function bitcrusherNodes(inputNode) {
	let preGain = new GainNode(audioCtx, {gain: 1});
	let bitcrusher = new AudioWorkletNode(audioCtx, "bitcrusher-processor");
	bitcrusher.parameters.get("bits").value = 16;
	let postGain = new GainNode(audioCtx, {gain: 1});
	inputNode.connect(preGain).connect(bitcrusher).connect(postGain);
	audioNodes.bitcrusherNodes = {
		preGain,
		bitcrusher,
		postGain,
	};

	return postGain;
}

/**
 * Apply the distortion effect and add the used nodes to audioNodes
 * @param {AudioNode} inputNode a node to apply the effects to
 * @returns an AudioNode with the distortion effects applied
 */
function distortionNodes(inputNode) {
	const drive = audioCtx.createGain();
	const normalize = audioCtx.createGain();
	const postGain = audioCtx.createGain();
	const compressor = audioCtx.createDynamicsCompressor();
	inputNode.connect(drive);
	drive.connect(compressor);
	compressor.connect(normalize);
	normalize.connect(postGain);
	drive.gain.value = 1;
	normalize.gain.value = 1;
	postGain.gain.value = 1;
	compressor.attack.value = 0;
	compressor.release.value = 0;
	compressor.threshold.value = 0;
	audioNodes.distortionNodes = {
		drive,
		normalize,
		postGain,
		compressor,
	};
	return postGain;
}

/**
 * Apply the echo effect and add the used nodes to audioNodes
 * @param {AudioNode} inputNode a node to apply the effects to
 * @returns an AudioNode with the echo effects applied
 */
function echoNodes(inputNode) {
	const passthrough = new GainNode(audioCtx, {gain: 1});
	const delay = new DelayNode(audioCtx, {
		delayTime: 0.5,
		maxDelayTime: 10,
	});
	const feedback = new GainNode(audioCtx, {
		gain: 0,
	});
	inputNode.connect(passthrough);
	passthrough.connect(delay);
	delay.connect(feedback);
	feedback.connect(passthrough);
	audioNodes.echoNodes = {
		delay,
		feedback,
	};
	return passthrough;
}

/**
 * Apply the stereo difference (difference between left and right channel) effect and add the used nodes to audioNodes
 * @param {AudioNode} inputNode a node to apply the effects to
 * @returns an AudioNode with the stereo difference effect applied
 */
function stereoDiffNodes(inputNode) {
	let stereoDiff = new AudioWorkletNode(audioCtx, "stereodiff-processor");
	stereoDiff.parameters.get("passthrough").value = true;
	let postGain = new GainNode(audioCtx, {gain: 1});
	inputNode.connect(stereoDiff).connect(postGain);
	audioNodes.stereoDiffNodes = {
		stereoDiff,
		postGain,
	};

	return postGain;
}
