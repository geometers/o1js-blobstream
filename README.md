# o1js-pairing

This repository implements Groth16 verification in o1js. 

It comes with 3 different parts: 

1. A single circuit that runs end to end verifier in ~700,000 constraints.
   
    Roughly 350,000 for multi Miller loop computation and ~350,000 for proving that multi Miller loop output is an "r-th" residue,
based on techniques developed in ["On proving pairings"](https://eprint.iacr.org/2024/640).

    To run this circuit do the following: 
```bash
cd contracts
npm install
npm run build
node --max-old-space-size=65536 build/src/groth16/multi_miller.js
```

    However, Mina programs are bounded by 64k constraints, so the computation is divided into smaller specialized circuits. Those circuits are then interconnected with different recursion techniques introduced in PCD. 

2. In the folder `zkprograms` there is a chain of 24 connected circuits where each circuit `i` does a specific part of verification and verifies circuit `i-1`. This approach comes with a significant computational overhead. 
Namely, in order to prove circuit `i` this approach requires compiling all verifications `1..i-1` which can take up to `2` hours to prove all 24 programs. 
In order to run circuit `i` do the following: 
```bash
cd contracts
npm install
npm run build
i=1 && node build/src/zkprograms/prove.js `zkp$i` 
```
To mitigate this overhead we introduce the third approach. 

3. Instead of building recursive chain we build a recursive tree. 
In the folder `recursion` there are 19 specialized circuits that prove specific parts of the verifier. These circuits are leaves of the computational tree, or in other words that is `layer0` of our tree. We then introduce two generic compressor circuits.

    These circuits are taking 2 by 2 proofs from layer `i` and by folding them into a new proof we build a layer `i + 1`.  This pattern is repeated until there is one proof left (a root of a tree). The main reponsibility of the compressor circuit is making sure that the output of the left subtree is equal to the input of the right subtree. Last but not least, it also makes sure to carry the public inputs of the Groth16 proof all the way to the root.

    Finally, the root proof is then handed to the decider (verifier) which checks that whole recursion was carried correctly and constraints Groth16 public inputs. These circuits can be found in the folder `compression`.  

    In order to run this part we had to extend o1js with some custom features, thus we need a local o1js version that supports tree compression.  Note that the first run of this process is slower, since it builds the circuits for the first time and has no cache.

    To run this part do the following: 

```bash
git clone https://github.com/o1-labs/o1js.git
cd o1js
git submodule update --init --recursive
npm install && npm run build 
cd ../contracts 
npm install && npm run build  
./src/demo/run_example.sh  
```





