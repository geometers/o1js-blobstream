import { AccountUpdate, Field, Mina, PrivateKey, UInt8 } from 'o1js';
import { HelloWorldRollup, StateBytes, adminPrivateKey } from './decider_app.js';
import { NodeProofLeft } from '../../structs.js';
import fs from "fs"
import { parsePublicInputs } from '../parse_pi.js';

const round = (x: number) => Math.round(x * 100) / 100;

function getProfiler(name: string) {
    let times: Record<string, any> = {};
    let label: string;
  
    return {
      get times() {
        return times;
      },
      start(label_: string) {
        label = label_;
        times = {
          ...times,
          [label]: {
            start: performance.now(),
          },
        };
      },
      stop() {
        times[label].end = performance.now();
        return this;
      },
      store() {
        let profilingData = `## Times for ${name}\n\n`;
        profilingData += `| Name | time passed in s |\n|---|---|`;
        let totalTimePassed = 0;
  
        Object.keys(times).forEach((k) => {
          let timePassed = (times[k].end - times[k].start) / 1000;
          totalTimePassed += timePassed;
  
          profilingData += `\n|${k}|${round(timePassed)}|`;
        });
  
        profilingData += `\n\nIn total, it took ${round(
          totalTimePassed
        )} seconds to run the entire benchmark\n\n\n`;
  
      },
    };
  }

const HelloWorldRollupProfiler = getProfiler('Hello World');
HelloWorldRollupProfiler.start('Hello World test flow');


let txn, txn2, txn3, txn4;
// setup local ledger
let Local = await Mina.LocalBlockchain({ proofsEnabled: true });
Mina.setActiveInstance(Local);

// test accounts that pays all the fees, and puts additional funds into the contract
const [feePayer1, feePayer2, feePayer3, feePayer4] = Local.testAccounts;

// contract account
const contractAccount = Mina.TestPublicKey.random();
const contract = new HelloWorldRollup(contractAccount);
await HelloWorldRollup.compile();

console.log('Deploying Decider ....');

txn = await Mina.transaction(feePayer1, async () => {
  AccountUpdate.fundNewAccount(feePayer1);
  await contract.deploy();
});
await txn.sign([feePayer1.key, contractAccount.key]).send();

const initialState =
  Mina.getAccount(contractAccount).zkapp?.appState?.[0].toString();

let currentState;

console.log('Initial State', initialState);

// update state with value that satisfies preconditions and correct admin private key
console.log(
  `updating rollup state`
);

const rootProof = await NodeProofLeft.fromJSON(JSON.parse(fs.readFileSync(`./src/plonk/recursion/proofs/layer5/p0.json`, 'utf8')));

const args = process.argv; 
const programVk = args[2]
const hexPi = args[3]; 

const [_, newStateUnused] = parsePublicInputs(programVk, hexPi);

const newState = StateBytes.fromString(hexPi)
txn = await Mina.transaction(feePayer1, async () => {
  await contract.update(adminPrivateKey, rootProof, newState);
});
await txn.prove();
await txn.sign([feePayer1.key]).send();

currentState = Mina.getAccount(contractAccount).zkapp?.appState?.[0].toString();
console.log(`Current state successfully updated to ${currentState}`);


HelloWorldRollupProfiler.stop().store();