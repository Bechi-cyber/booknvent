import os

def list_files(directory):
    print(f"Files in {directory}:")
    for item in os.listdir(directory):
        item_path = os.path.join(directory, item)
        if os.path.isfile(item_path):
            print(f"  - {item} (File)")
        else:
            print(f"  - {item} (Directory)")

if __name__ == "__main__":
    list_files("web_version")
