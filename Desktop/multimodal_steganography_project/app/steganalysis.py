"""
Steganalysis module for detecting steganography and assessing security.

This module provides tools to analyze files for potential hidden messages
and evaluate the security of steganography techniques.
"""

import os
import numpy as np
from PIL import Image
import librosa
import re

# Constants for security scoring
SECURITY_LEVELS = {
    'VERY_LOW': 1,
    'LOW': 2,
    'MEDIUM': 3,
    'HIGH': 4,
    'VERY_HIGH': 5
}

class SteganalysisResult:
    """Class to store and represent steganalysis results."""
    
    def __init__(self, detection_probability, security_score, details=None):
        """
        Initialize a steganalysis result.
        
        Args:
            detection_probability (float): Probability of steganography detection (0-1)
            security_score (int): Security score (1-5)
            details (dict, optional): Detailed analysis results
        """
        self.detection_probability = detection_probability
        self.security_score = security_score
        self.details = details or {}
    
    @property
    def security_level(self):
        """Get the security level as a string."""
        for level, score in SECURITY_LEVELS.items():
            if self.security_score == score:
                return level
        return 'UNKNOWN'
    
    def get_recommendations(self):
        """Get security improvement recommendations based on the analysis."""
        recommendations = []
        
        if self.security_score <= SECURITY_LEVELS['LOW']:
            recommendations.append("Consider using a more secure steganography technique.")
            recommendations.append("Always use encryption with your hidden messages.")
            
        if 'lsb_uniformity' in self.details and self.details['lsb_uniformity'] > 0.1:
            recommendations.append("The LSB pattern is detectable. Try using a more random embedding pattern.")
            
        if 'file_size_increase' in self.details and self.details['file_size_increase'] > 10:
            recommendations.append("File size increase is significant. Consider using a carrier with larger capacity.")
        
        return recommendations
    
    def __str__(self):
        """String representation of the analysis result."""
        return (f"Detection Probability: {self.detection_probability:.2f}\n"
                f"Security Score: {self.security_score}/5 ({self.security_level})")


def analyze_image(image_path, original_path=None):
    """
    Analyze an image file for potential steganography.
    
    Args:
        image_path (str): Path to the image to analyze
        original_path (str, optional): Path to the original image for comparison
        
    Returns:
        SteganalysisResult: Analysis results
    """
    try:
        # Load the image
        img = Image.open(image_path)
        img_array = np.array(img)
        
        details = {}
        
        # Check for LSB steganography
        lsb_score = analyze_image_lsb(img_array)
        details['lsb_uniformity'] = lsb_score
        
        # Check file size if original is available
        size_score = 0
        if original_path and os.path.exists(original_path):
            original_size = os.path.getsize(original_path)
            stego_size = os.path.getsize(image_path)
            size_diff_percent = ((stego_size - original_size) / original_size) * 100
            details['file_size_increase'] = size_diff_percent
            size_score = min(1.0, size_diff_percent / 20)  # Normalize to 0-1
        
        # Calculate detection probability
        detection_probability = (lsb_score + size_score) / (2 if original_path else 1)
        
        # Calculate security score (inverse of detection probability)
        security_score = calculate_security_score(detection_probability)
        
        return SteganalysisResult(detection_probability, security_score, details)
    
    except Exception as e:
        print(f"Error analyzing image: {str(e)}")
        return SteganalysisResult(0.5, SECURITY_LEVELS['MEDIUM'], {'error': str(e)})


def analyze_audio(audio_path, original_path=None):
    """
    Analyze an audio file for potential steganography.
    
    Args:
        audio_path (str): Path to the audio file to analyze
        original_path (str, optional): Path to the original audio for comparison
        
    Returns:
        SteganalysisResult: Analysis results
    """
    try:
        # Load the audio
        y, sr = librosa.load(audio_path, sr=None)
        
        details = {}
        
        # Check for phase encoding steganography
        phase_score = analyze_audio_phase(y)
        details['phase_irregularity'] = phase_score
        
        # Check spectral statistics
        spectral_score = analyze_audio_spectral(y, sr)
        details['spectral_anomaly'] = spectral_score
        
        # Check file size if original is available
        size_score = 0
        if original_path and os.path.exists(original_path):
            original_size = os.path.getsize(original_path)
            stego_size = os.path.getsize(audio_path)
            size_diff_percent = ((stego_size - original_size) / original_size) * 100
            details['file_size_increase'] = size_diff_percent
            size_score = min(1.0, size_diff_percent / 20)  # Normalize to 0-1
        
        # Calculate detection probability
        detection_probability = (phase_score + spectral_score + size_score) / (3 if original_path else 2)
        
        # Calculate security score (inverse of detection probability)
        security_score = calculate_security_score(detection_probability)
        
        return SteganalysisResult(detection_probability, security_score, details)
    
    except Exception as e:
        print(f"Error analyzing audio: {str(e)}")
        return SteganalysisResult(0.5, SECURITY_LEVELS['MEDIUM'], {'error': str(e)})


def analyze_text(text_content, original_content=None):
    """
    Analyze text for potential steganography.
    
    Args:
        text_content (str): Text content to analyze
        original_content (str, optional): Original text for comparison
        
    Returns:
        SteganalysisResult: Analysis results
    """
    try:
        details = {}
        
        # Check for whitespace steganography
        whitespace_score = analyze_text_whitespace(text_content)
        details['whitespace_irregularity'] = whitespace_score
        
        # Check for zero-width character steganography
        zw_score = analyze_text_zero_width(text_content)
        details['zero_width_characters'] = zw_score
        
        # Check for unusual character distribution
        char_score = analyze_text_character_distribution(text_content)
        details['character_distribution_anomaly'] = char_score
        
        # Calculate detection probability
        detection_probability = (whitespace_score + zw_score + char_score) / 3
        
        # Calculate security score (inverse of detection probability)
        security_score = calculate_security_score(detection_probability)
        
        return SteganalysisResult(detection_probability, security_score, details)
    
    except Exception as e:
        print(f"Error analyzing text: {str(e)}")
        return SteganalysisResult(0.5, SECURITY_LEVELS['MEDIUM'], {'error': str(e)})


def analyze_image_lsb(img_array):
    """
    Analyze the least significant bits of an image for steganography.
    
    Args:
        img_array (numpy.ndarray): Image as a numpy array
        
    Returns:
        float: LSB uniformity score (0-1, higher means more likely to contain hidden data)
    """
    # Extract the LSB plane
    lsb_plane = img_array & 1
    
    # Calculate the frequency of 0s and 1s
    total_pixels = lsb_plane.size
    ones_count = np.sum(lsb_plane)
    zeros_count = total_pixels - ones_count
    
    # Calculate the ratio (should be close to 0.5 for natural images)
    ratio = ones_count / total_pixels
    
    # Calculate how far the ratio is from the expected 0.5
    # A value close to 0 means natural, close to 1 means likely steganography
    uniformity_score = 2 * abs(ratio - 0.5)
    
    return uniformity_score


def analyze_audio_phase(y):
    """
    Analyze audio phase for steganography.
    
    Args:
        y (numpy.ndarray): Audio signal
        
    Returns:
        float: Phase irregularity score (0-1)
    """
    # Simple analysis: check for unusual phase patterns
    # In a real implementation, this would be more sophisticated
    
    # Take a sample of the signal
    sample_size = min(1000, len(y))
    sample = y[:sample_size]
    
    # Calculate phase differences
    phase_diffs = np.diff(np.angle(np.fft.fft(sample)))
    
    # Check for unusual patterns in phase differences
    # (This is a simplified approach)
    irregularity = np.std(phase_diffs) / np.pi
    
    # Normalize to 0-1
    return min(1.0, irregularity)


def analyze_audio_spectral(y, sr):
    """
    Analyze audio spectral properties for steganography.
    
    Args:
        y (numpy.ndarray): Audio signal
        sr (int): Sample rate
        
    Returns:
        float: Spectral anomaly score (0-1)
    """
    # Calculate spectral contrast
    contrast = librosa.feature.spectral_contrast(y=y, sr=sr)
    
    # Check for unusual patterns in spectral contrast
    # (This is a simplified approach)
    anomaly_score = np.std(contrast) / np.mean(np.abs(contrast))
    
    # Normalize to 0-1
    return min(1.0, anomaly_score)


def analyze_text_whitespace(text):
    """
    Analyze text for whitespace-based steganography.
    
    Args:
        text (str): Text content
        
    Returns:
        float: Whitespace irregularity score (0-1)
    """
    # Count spaces and tabs
    space_count = text.count(' ')
    tab_count = text.count('\t')
    
    # Count consecutive spaces
    consecutive_spaces = len(re.findall(r' {2,}', text))
    
    # Count trailing spaces
    trailing_spaces = len(re.findall(r' +$', text, re.MULTILINE))
    
    # Calculate irregularity score
    total_chars = len(text)
    if total_chars == 0:
        return 0
    
    whitespace_ratio = (space_count + tab_count) / total_chars
    irregularity_score = (consecutive_spaces + trailing_spaces) / (space_count + 1)
    
    # Combine scores (weighted)
    combined_score = (0.3 * whitespace_ratio) + (0.7 * irregularity_score)
    
    # Normalize to 0-1
    return min(1.0, combined_score)


def analyze_text_zero_width(text):
    """
    Analyze text for zero-width character steganography.
    
    Args:
        text (str): Text content
        
    Returns:
        float: Zero-width character score (0-1)
    """
    # Count zero-width characters
    zero_width_chars = len(re.findall(r'[\u200B-\u200F\u2060-\u2064\uFEFF]', text))
    
    # Calculate score based on presence of zero-width characters
    if len(text) == 0:
        return 0
    
    zw_ratio = zero_width_chars / len(text)
    
    # Normalize to 0-1
    return min(1.0, zw_ratio * 100)  # Multiply by 100 as these are rare


def analyze_text_character_distribution(text):
    """
    Analyze text for unusual character distribution.
    
    Args:
        text (str): Text content
        
    Returns:
        float: Character distribution anomaly score (0-1)
    """
    if not text:
        return 0
    
    # Count character frequencies
    char_counts = {}
    for char in text:
        char_counts[char] = char_counts.get(char, 0) + 1
    
    # Calculate entropy
    total_chars = len(text)
    entropy = 0
    for count in char_counts.values():
        probability = count / total_chars
        entropy -= probability * np.log2(probability)
    
    # Normalize entropy (max entropy for English text is typically around 4.5)
    normalized_entropy = entropy / 4.5
    
    # Deviation from expected entropy (both too high and too low are suspicious)
    entropy_deviation = abs(normalized_entropy - 0.75)
    
    # Normalize to 0-1
    return min(1.0, entropy_deviation * 2)


def calculate_security_score(detection_probability):
    """
    Calculate a security score based on detection probability.
    
    Args:
        detection_probability (float): Probability of detection (0-1)
        
    Returns:
        int: Security score (1-5, higher is more secure)
    """
    # Invert the detection probability (higher detection = lower security)
    security_value = 1 - detection_probability
    
    # Map to security levels
    if security_value < 0.2:
        return SECURITY_LEVELS['VERY_LOW']
    elif security_value < 0.4:
        return SECURITY_LEVELS['LOW']
    elif security_value < 0.6:
        return SECURITY_LEVELS['MEDIUM']
    elif security_value < 0.8:
        return SECURITY_LEVELS['HIGH']
    else:
        return SECURITY_LEVELS['VERY_HIGH']


def get_overall_security_assessment(file_path, file_type, original_path=None):
    """
    Get an overall security assessment for a file.
    
    Args:
        file_path (str): Path to the file to analyze
        file_type (str): Type of file ('image', 'audio', or 'text')
        original_path (str, optional): Path to the original file for comparison
        
    Returns:
        SteganalysisResult: Analysis results
    """
    if file_type == 'image':
        return analyze_image(file_path, original_path)
    elif file_type == 'audio':
        return analyze_audio(file_path, original_path)
    elif file_type == 'text':
        # For text files, read the content first
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            text_content = f.read()
        
        original_content = None
        if original_path:
            with open(original_path, 'r', encoding='utf-8', errors='ignore') as f:
                original_content = f.read()
        
        return analyze_text(text_content, original_content)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")
