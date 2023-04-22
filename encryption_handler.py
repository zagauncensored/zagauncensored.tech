from cryptography.fernet import Fernet

# Generate a key and save it in a file named 'encryption_key.key'
def generate_key():
    key = Fernet.generate_key()
    with open("encryption_key.key", "wb") as key_file:
        key_file.write(key)

# Load the key from the file
def load_key():
    return open("encryption_key.key", "rb").read()

# Encrypt the data using the key
def encrypt_data(data, key):
    f = Fernet(key)
    encrypted_data = f.encrypt(data.encode())
    return encrypted_data

# Decrypt the data using the key
def decrypt_data(encrypted_data, key):
    f = Fernet(key)
    decrypted_data = f.decrypt(encrypted_data).decode()
    return decrypted_data

if __name__ == '__main__':
    generate_key()
