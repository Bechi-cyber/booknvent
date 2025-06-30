from setuptools import setup, find_packages

setup(
    name="lesavot",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "numpy>=1.19.0",
        "Pillow>=8.0.0",
        "scipy>=1.5.0",
    ],
    entry_points={
        'console_scripts': [
            'lesavot=lesavot.main:main',
        ],
    },
    author="LESAVOT Team",
    author_email="example@example.com",
    description="Multimodal steganography framework for enhanced data security and privacy",
    keywords="steganography, security, privacy, data hiding",
    python_requires=">=3.7",
)