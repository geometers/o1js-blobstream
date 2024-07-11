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

# gamma = 0x62657461
# vx = 10627327753818917257580031743580923447218792977466576262416509126412843282369

# print(bit_string_8(0x62657461))
# print(len(bit_string_8(0x62657461)))
# print(len(bit_string_8(0x616C706861)))
# print(len(bin(0x616C706861)[2:]))

# zeta = 0x7a657461
# print(len(bit_string_8(zeta)))
# print(len(bin(zeta)[2:]))

# print(bin(67108864))

# bit_string = bit_string_8(gamma) + bit_string_8(vx)
# byte_data = bits_to_bytes(bit_string)

# sha256_hash = hashlib.sha256(byte_data).hexdigest()
# print(f"SHA-256: {int(sha256_hash, 16)}")
# print(f"SHA-256: {sha256_hash}")

a = 21
b = 14 

m = 7 

assert((a * b) % m == (a % m) * (b % m))

"""
x = 2^255 + 2^254 + l, b < r
(x * b) % r = ((2^255 % r)*b)%r + ((2^254 % r)*b)%r + (((l % r)% r)*b)%r 
"""