const audioContext = window.AudioContext ? new AudioContext() : null;

function playTone(frequency, duration, type = 'sine') {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

export function playSound(type) {
  if (type === 'correct') {
    playTone(880, 0.15);
    setTimeout(() => playTone(1174, 0.2), 120);
  } else if (type === 'wrong') {
    playTone(200, 0.3, 'sawtooth');
  } else if (type === 'tick') {
    playTone(600, 0.08, 'square');
  }
}