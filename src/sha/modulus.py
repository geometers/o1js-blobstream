q = 21888242871839275222246405745257275088548364400416034343698204186575808495617

# we want to compute x % q where x is 256 bit number and we can't work with field larger than 2^254

# print(len(bin(2**255 % q)[2:]))
# print(len(bin(2**256 % q)[2:]))

sh254 = (2**254) % q
sh255 = (2**255) % q

print(sh254)
print(sh255)

def bin_256(x): 
    assert(x < 2**256)
    return (bin(x)[2:]).rjust(256, '0')


def modulus(x): 
    bin_x = bin_256(x)

    # take first 254 bits 
    low = int(bin_x[2:], 2)
    low_mod = low % q 

    bit_256 = int(bin_x[0])
    bit_255 = int(bin_x[1])

    mid = 0 
    if bit_255 == 1: 
        mid = sh254

    hi = 0 
    if bit_256 == 1: 
        hi = sh255


    assert(x == low + bit_255*2**254 + bit_256*2**255)

    return (low_mod + mid + hi) % q


x = 41934624648789633692325845435058116789193741866735454986050232623745889205117
assert(x % q == modulus(x))
print(x % q)