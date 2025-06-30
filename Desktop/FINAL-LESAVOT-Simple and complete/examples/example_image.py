from PIL import Image
import numpy as np

class ImageSteganography:
    """
    Implements LSB (Least Significant Bit) steganography for images.
    """

    def __init__(self):
        pass

    def embed(self, image_path, message, output_path):
        """
        Embeds a message in an image using LSB steganography.
        """
        try:
            img = Image.open(image_path)
            width, height = img.size
            img_array = np.array(img)

            binary_message = ''.join(format(ord(char), '08b') for char in message)
            binary_message += '00000000'

            if len(binary_message) > width * height * 3:
                print("Error: Message too large for the image")
                return False

            idx = 0
            for i in range(height):
                for j in range(width):
                    for k in range(3):  # RGB channels
                        if idx < len(binary_message):
                            img_array[i, j, k] = (img_array[i, j, k] & ~1) | int(binary_message[idx])
                            idx += 1
                        else:
                            break
                    if idx >= len(binary_message):
                        break
                if idx >= len(binary_message):
                    break

            output_img = Image.fromarray(img_array)
            output_img.save(output_path)
            return True

        except Exception as e:
            print(f"Error embedding message: {e}")
            return False

    def extract(self, image_path):
        """
        Extracts a hidden message from an image.
        """
        try:
            img = Image.open(image_path)
            width, height = img.size
            img_array = np.array(img)

            binary_message = ""
            for i in range(height):
                for j in range(width):
                    for k in range(3):  # RGB channels
                        binary_message += str(img_array[i, j, k] & 1)

                        if len(binary_message) % 8 == 0:
                            if binary_message[-8:] == "00000000":
                                message = ""
                                for idx in range(0, len(binary_message) - 8, 8):
                                    byte = binary_message[idx:idx+8]
                                    message += chr(int(byte, 2))
                                return message

            return "No hidden message found"

        except Exception as e:
            print(f"Error extracting message: {e}")
            return None

def main():
    # Create an instance of ImageSteganography
    steg = ImageSteganography()

    # Embed a message in an image
    input_image = "examples/data/original.png"
    output_image = "examples/data/stego.png"
    message = "This is a secret message hidden in an image!"

    print(f"Embedding message: '{message}'")
    success = steg.embed(input_image, message, output_image)

    if success:
        print(f"Message successfully embedded in {output_image}")

        # Extract the message from the stego image
        extracted = steg.extract(output_image)
        print(f"Extracted message: '{extracted}'")
    else:
        print("Failed to embed message")

if __name__ == "__main__":
    main()