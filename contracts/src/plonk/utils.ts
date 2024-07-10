import assert from "assert"

function assertPointOnBn(x: bigint, y: bigint) {
    const q = 21888242871839275222246405745257275088696311157297823662689037894645226208583n

    assert(x < q)
    assert(y < q) 

    const v = y * y - x*x*x - 3n 
    assert(v % q === 0n)
}

function assertInBnField(x: bigint) {
    const r = 21888242871839275222246405745257275088548364400416034343698204186575808495617n
    assert(x < r)
}

// assumes that string is valid hex
function unsafeHex2Bytes(hex: string): Uint8Array {
    const key = '0123456789abcdef'

    const bytes = []
    for (let i = 2; i < hex.length; i+= 2) {
        let byte = key.indexOf(hex[i]) << 4
        byte += key.indexOf(hex[i + 1])

        bytes.push(byte)
    }

    return Uint8Array.from(bytes)
}

// counts amount of uin256 numbers in hex string
function numOfUin256s(hex: string) {
    // each hex char is 4 bits so 64 chars is 1 uint256
    // skip "0x" and skip first 4 bytes that Sp1.Verifier skips 

    assert((hex.length - 10) % 64 == 0)
    return (hex.length - 10) / 64
}

export { assertPointOnBn, assertInBnField, unsafeHex2Bytes, numOfUin256s }