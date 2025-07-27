class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    // Add outputs parameter
    const input = inputs[0]
    const output = outputs[0]

    if (input && input[0] && output && output[0]) {
      // Copy entire input buffer to output buffer (pass-through)
      output[0].set(input[0])

      // Send copy to main thread for socket transmission
      this.port.postMessage(input[0]) // or output[0], same data
    }
    return true
  }
}

registerProcessor('audio-processor', AudioProcessor)
