# Multimodal Steganography Project

A comprehensive steganography application that allows hiding secret messages in images, audio files, and text documents. This project demonstrates various steganography techniques with a user-friendly web interface built with Flask.

## Features

- **Image Steganography**: Hide messages within image files using LSB (Least Significant Bit) technique
- **Audio Steganography**: Conceal messages in audio files using phase encoding
- **Text Steganography**: Embed messages in text documents using whitespace and special character techniques
- **Military-grade Encryption**: All hidden messages can be encrypted with AES-256 encryption
- **User Authentication**: Secure login and registration system
- **Web Interface**: Easy-to-use web-based interface
- **Pop-up Notifications**: Alerts for incorrect decryption passwords
- **AI-Powered Steganalysis**: Security testing and vulnerability assessment for steganography methods

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/BECHIJ/multimodal-steganography.git
   cd multimodal-steganography
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the application:
   ```bash
   python app.py
   ```

5. Open your browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

## Development Setup

This project uses Visual Studio Code as the recommended development environment. See [VS_CODE_SETUP.md](VS_CODE_SETUP.md) for detailed setup instructions.

### Running Tests

```bash
pytest -v
```

### Code Formatting

The project uses autopep8 for code formatting:

```bash
autopep8 --in-place --aggressive --aggressive --max-line-length 120 *.py app/*.py
```

## Project Structure

```
multimodal_steganography_project/
├── app/                    # Application package
│   ├── __init__.py         # Package initialization
│   ├── auth.py             # Authentication functions
│   ├── auth_views.py       # Authentication routes
│   ├── encryption.py       # Encryption/decryption utilities
│   ├── file_manager.py     # File handling utilities
│   ├── steganalysis.py     # AI-powered steganalysis system
│   ├── steganography.py    # Steganography algorithms
│   └── views.py            # Main application routes
├── static/                 # Static files (CSS, JS, images)
│   ├── css/                # Stylesheets
│   ├── js/                 # JavaScript files
│   ├── images/             # Image assets
│   ├── uploads/            # User uploaded files
│   └── output/             # Generated output files
├── templates/              # HTML templates
│   ├── auth/               # Authentication templates
│   ├── base.html           # Base template
│   └── ...                 # Other templates
├── venv/                   # Virtual environment (not in repo)
├── .vscode/                # VS Code configuration
├── app.py                  # Application entry point
├── requirements.txt        # Project dependencies
└── README.md               # Project documentation
```

## Security Features

- AES-256 encryption for all hidden messages
- Password-based key derivation with salt
- Secure password hashing for user authentication
- CSRF protection for all forms
- Input validation and sanitization
- Proper error handling for incorrect passwords

## AI-Powered Steganalysis

The project includes an advanced AI-powered steganalysis system that helps users assess the security of their steganography methods:

### Steganalysis Features

- **Security Scoring**: Evaluates steganography techniques on a scale of 1-5
- **Vulnerability Detection**: Identifies potential weaknesses in hidden messages
- **Statistical Analysis**: Uses pattern recognition to detect steganography signatures
- **Detailed Reporting**: Provides comprehensive analysis results with visualizations
- **Security Recommendations**: Offers actionable advice to improve steganography security

### Supported Analysis Types

- **Image Steganalysis**: Detects LSB steganography through bit pattern analysis
  - Analyzes LSB uniformity and distribution
  - Detects anomalies in color patterns
  - Identifies suspicious file size changes

- **Audio Steganalysis**: Identifies audio steganography techniques
  - Analyzes phase encoding patterns
  - Detects spectral anomalies
  - Identifies unusual frequency distributions

- **Text Steganalysis**: Detects text-based steganography
  - Identifies whitespace steganography
  - Detects zero-width character insertion
  - Analyzes character distribution anomalies

### How It Works

The steganalysis system uses a combination of statistical analysis and pattern recognition techniques to identify potential steganography:

1. **Data Extraction**: Analyzes the uploaded file's binary data
2. **Pattern Analysis**: Applies statistical tests to detect steganography signatures
3. **Anomaly Detection**: Identifies deviations from expected patterns
4. **Security Scoring**: Calculates a security score based on detection probability
5. **Recommendation Generation**: Creates tailored security improvement suggestions

This AI-powered approach provides users with valuable insights into the security of their steganography methods without requiring complex machine learning infrastructure.

## Security Considerations

- The encryption key in `encryption.py` should be changed for production use
- This project is for educational purposes only
- Do not use for sensitive information without proper security review

## License

This project is open source and available under the MIT License.

## Acknowledgments

- [Flask](https://flask.palletsprojects.com/) - Web framework
- [Pillow](https://python-pillow.org/) - Image processing
- [Librosa](https://librosa.org/) - Audio processing
- [PyCryptodome](https://pycryptodome.readthedocs.io/) - Cryptographic functions
- [NumPy](https://numpy.org/) - Numerical computing for AI steganalysis
- [SciPy](https://scipy.org/) - Scientific computing for signal processing
