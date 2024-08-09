import struct
import hashlib

# Initial hash values (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19)
H = [
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19
]

# Constants (first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]

def sha256_compress(chunk, H):
    # Define bitwise functions as specified in the SHA-256 standard
    def right_rotate(x, n):
        return (x >> n) | (x << (32 - n)) & 0xFFFFFFFF

    def ch(x, y, z):
        return (x & y) ^ (~x & z)

    def maj(x, y, z):
        return (x & y) ^ (x & z) ^ (y & z)

    def Σ0(x):
        return right_rotate(x, 2) ^ right_rotate(x, 13) ^ right_rotate(x, 22)

    def Σ1(x):
        return right_rotate(x, 6) ^ right_rotate(x, 11) ^ right_rotate(x, 25)

    def σ0(x):
        return right_rotate(x, 7) ^ right_rotate(x, 18) ^ (x >> 3)

    def σ1(x):
        return right_rotate(x, 17) ^ right_rotate(x, 19) ^ (x >> 10)

    # Break chunk into sixteen 32-bit big-endian words w[0..15]
    w = list(struct.unpack('>16L', chunk))

    # Extend the sixteen 32-bit words into sixty-four 32-bit words w[16..63]
    for i in range(16, 64):
        w.append((σ1(w[i - 2]) + w[i - 7] + σ0(w[i - 15]) + w[i - 16]) & 0xFFFFFFFF)

    # Initialize working variables to current hash value
    a, b, c, d, e, f, g, h = H

    # Compression function main loop
    for i in range(64):
        T1 = (h + Σ1(e) + ch(e, f, g) + K[i] + w[i]) & 0xFFFFFFFF
        T2 = (Σ0(a) + maj(a, b, c)) & 0xFFFFFFFF
        h = g
        g = f
        f = e
        e = (d + T1) & 0xFFFFFFFF
        d = c
        c = b
        b = a
        a = (T1 + T2) & 0xFFFFFFFF

    # Add the compressed chunk to the current hash value
    H[0] = (H[0] + a) & 0xFFFFFFFF
    H[1] = (H[1] + b) & 0xFFFFFFFF
    H[2] = (H[2] + c) & 0xFFFFFFFF
    H[3] = (H[3] + d) & 0xFFFFFFFF
    H[4] = (H[4] + e) & 0xFFFFFFFF
    H[5] = (H[5] + f) & 0xFFFFFFFF
    H[6] = (H[6] + g) & 0xFFFFFFFF
    H[7] = (H[7] + h) & 0xFFFFFFFF

    return H

def sha256(message):
    # Pre-processing
    message = bytearray(message)
    orig_len_in_bits = (8 * len(message)) & 0xffffffffffffffff
    message.append(0x80)
    while len(message) % 64 != 56:
        message.append(0)
    message += struct.pack('>Q', orig_len_in_bits)

    # Initialize hash values
    H_values = H[:]

    # Process the message in successive 512-bit chunks
    for i in range(0, len(message), 64):
        chunk = message[i:i + 64]
        H_values = sha256_compress(chunk, H_values)
        print('H_values uint32 %s: %s' % (i, ', '.join([str(x) for x in H_values])))
        print('H_values %s: %s' % (i, ''.join(f'{x:08x}' for x in H_values)))

    # Produce the final hash value (big-endian)
    return ''.join(f'{x:08x}' for x in H_values)

# Example usage
if __name__ == "__main__":
    message = bytearray.fromhex('1d000000000000000000000000000000000000000000000000000000000000000000240713d400000000000000504b03041400000008000476ea5878d6fead2a0000004e0000000a001c00332d646174612e747874555409000308838e660a838e6675780b000104f50100000414000000358bc111003008c2567181d0fdb72bb1d707920321c9248c468f3a4593cda624af61d90ef597bcbffa05504b01021e031400000008000476ea5878d6fead2a0000004e0000000a0018000000000001000000a48100000000332d646174612e747874555405000308838e6675780b000104f50100000414000000504b05060000000001000100500000006e00000000000e38cf85aee627d711b046ecd5749f7f276b2212dcb33f8d7f1da16e89bf9efc')
    print("SHA-256:", sha256(message))

