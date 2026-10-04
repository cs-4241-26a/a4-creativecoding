/**
 * Bitcrusher audio worklet processor
 * Expects one input connection and bits audioParam in [1, 16]
 */
class BitcrusherProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [
			{
				name: "bits",
				defaultValue: 4,
				minValue: 1,
				maxValue: 16,
				automationRate: "k-rate",
			},
		];
	}

	constructor() {
		super();
	}

	/**
	 * Bitcrushes the given sample
	 * @param { float } sample
	 * @param { float } bits
	 * @return the sample rounded to a nearest value specified by the number of bits allowed
	 */
	static bitcrush(sample, bits) {
		const values = 2 ** bits;
		return Math.round(sample * values) / values;
	}

	/**
	 * AudioWorkletProcessor.process() method
	 * @param {[[]]} inputs
	 * @param {[[]]} outputs
	 * @param {[]} parameters
	 * @returns true if the process should be kept alive
	 */
	process(inputs, outputs, parameters) {
		// The processor may have multiple inputs and outputs
		const input = inputs[0];
		const output = outputs[0];
		const bitValues = parameters.bits;
		for (let channel = 0; channel < input.length; ++channel) {
			const inputChannel = input[channel];
			const outputChannel = output[channel];
			const channelLength = inputChannel.length;
			if (bitValues.length === 1) {
				const bits = bitValues[0];
				if (bits >= 16) {
					for (let i = 0; i < channelLength; i++) {
						outputChannel[i] = inputChannel[i];
					}
				} else {
					for (let i = 0; i < channelLength; i++) {
						outputChannel[i] = BitcrusherProcessor.bitcrush(inputChannel[i], bits);
					}
				}
			} else {
				for (let i = 0; i < channelLength; i++) {
					const bits = bitValues[i];
					if (bits >= 16) {
						outputChannel[i] = inputChannel[i];
					} else {
						outputChannel[i] = BitcrusherProcessor.bitcrush(inputChannel[i], bits);
					}
				}
			}
		}
		return true;
	}
}

registerProcessor("bitcrusher-processor", BitcrusherProcessor);

/**
 * Stereo difference audio worklet processor; subtracts L/R channels, outputs in mono
 * Expects exactly 2 channels and one input
 */
class StereoDiffProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [
			{
				name: "passthrough",
				defaultValue: false,
				automationRate: "k-rate",
			},
		];
	}

	constructor() {
		super();
	}

	/**
	 * AudioWorkletProcessor.process() method
	 * @param {[[[]]]} inputs
	 * @param {[[[]]]} outputs
	 * @param {{[]}} parameters
	 * @returns true if the process should be kept alive
	 */
	process(inputs, outputs, parameters) {
		const input = inputs[0];
		const outputsLength = outputs.length;
		if (parameters.passthrough[0] || inputs[0].length < 2) {
			for (let outputNum = 0; outputNum < outputsLength; outputNum++) {
				for (let channel = 0; channel < outputs[outputNum].length; channel++) {
					outputs[outputNum][channel].set(input[channel]);
				}
			}
			return true;
		}
		const leftChannel = input[0];
		const rightChannel = input[1];
		const channelLength = leftChannel.length;
		for (let sample = 0; sample < channelLength; sample++) {
			const value = leftChannel[sample] - rightChannel[sample];
			for (let i = 0; i < outputsLength; i++) {
				outputs[i][0][sample] = value;
				outputs[i][1][sample] = value;
			}
		}
		return true;
	}
}

registerProcessor("stereodiff-processor", StereoDiffProcessor);
