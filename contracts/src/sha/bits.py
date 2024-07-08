import hashlib

def bit_string_8(x): 
    bn = bin(x)[2:]
    mod = len(bn) % 8

    if mod == 0: 
        return bn

    prefix = '0' * (8 - mod)
    return prefix + bn

def bits_to_bytes(bits):
    assert(len(bits) % 8 == 0)
    byte_array = bytearray()
    for i in range(0, len(bits), 8):
        byte_array.append(int(bits[i:i+8], 2))
    return bytes(byte_array)

gamma = 0x67616d6d61
vx = 10627327753818917257580031743580923447218792977466576262416509126412843282369

bit_string = bit_string_8(gamma) + bit_string_8(vx)
byte_data = bits_to_bytes(bit_string)

sha256_hash = hashlib.sha256(byte_data).hexdigest()
# print(f"SHA-256: {int(sha256_hash, 16)}")
# print(f"SHA-256: {sha256_hash}")


res = 41934624648789633692325845435058116789193741866735454986050232623745889205117
print(int('0b' + bin(res)[4:], base=2))