import numpy as np
from scipy.io import wavfile

# Create a simple sine wave audio file
sample_rate = 44100  # 44.1 kHz
duration = 5  # seconds
t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)

# Generate a 440 Hz sine wave
frequency = 440  # A4 note
audio_data = np.sin(2 * np.pi * frequency * t) * 32767  # Scale to 16-bit range

# Convert to 16-bit integer
audio_data = audio_data.astype(np.int16)

# Save as WAV file
wavfile.write('examples/data/sample_audio.wav', sample_rate, audio_data)
print("Sample audio created at examples/data/sample_audio.wav")
