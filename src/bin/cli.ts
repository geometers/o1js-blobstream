import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ComputationalPlanExecutor } from '../compute/executor.js';
import { performSp1ToPlonk } from '../api/sp1/plonk.js';
import { Logger } from '../logging/logger.js';
import { LogPrinter } from '../logging/log_printer.js';
import { performRisc0ToGroth16 } from '../api/sp1/groth16.js';

new LogPrinter('[NoriProofConverter]', [
  'log',
  'info',
  'warn',
  'error',
  'debug',
  'fatal',
  'verbose',
]);
const logger = new Logger('CLI');

// Define max processes
const MAX_PROCESSES = parseInt(process.env.MAX_PROCESSES || '1');
const executor = new ComputationalPlanExecutor(MAX_PROCESSES);

// Define the command type for function signatures
type CommandFunction = (args: any) => Promise<any>;

// Command map where key is command name, value is async function
const commandMap: Record<string, CommandFunction> = {
  sp1ToPlonk: (fileData) => performSp1ToPlonk(executor, fileData),
  risc0ToGroth16: ({ fileData1, fileData2 }) => performRisc0ToGroth16(executor, fileData1, fileData2),
};

// Get the current file's directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve package.json dynamically
const packageJsonPath = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'package.json'
);
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version as string;

// Utility to write output file with json extension
function writeJsonFile(
  filePath: string,
  commandName: string,
  resultStr: string
) {
  let dir = path.dirname(filePath);
  let base = path.basename(filePath);

  // Case-insensitive check for .json extension
  if (base.toLowerCase().endsWith('.json')) {
    base = base.slice(0, -5); // Remove .json extension
  }

  let newFilePath = path.join(dir, `${base}.${commandName}.json`);

  fs.writeFileSync(newFilePath, resultStr);
  return newFilePath;
}

const program = new Command();

// Set metadata for the CLI
program
  .name(Object.keys(packageJson.bin)[0])
  .description(packageJson.description)
  .version(packageJson.version);

// Define the main command
program
  .argument('<command>', 'command to execute (e.g. sp1ToPlonk)')
  .argument('<arg1>', 'first argument')
  .argument('[arg2]', 'second optional argument')
  .action((commandName: string, arg1: string, arg2?: string) => {
    logger.log(`Command '${commandName}' received with arg1 '${arg1}', arg2 '${arg2}'`);

    const commandFunction = commandMap[commandName];
    if (!commandFunction) {
      logger.fatal(`Command '${commandName}' not found.`);
      logger.fatal(`Available commands: ${Object.keys(commandMap).join(', ')}`);
      process.exit(1);
    }

    let args: any;
    try {
      if (commandName === 'risc0ToGroth16') {
        args = {
          fileData1: JSON.parse(fs.readFileSync(arg1, 'utf8')),
          fileData2: JSON.parse(fs.readFileSync(arg2!, 'utf8')),
        };
      } else {
        args = JSON.parse(fs.readFileSync(arg1, 'utf8'));
      }
    } catch (err) {
      logger.fatal(`Error processing arguments: ${err}`);
      process.exit(1);
    }

    commandFunction(args)
      .then((result) => {
        const resultStr = JSON.stringify(result, null, 2);
        const outputFilePath = writeJsonFile(arg1, commandName, resultStr);
        logger.log(`Wrote result of command ${commandName} to disk: ${outputFilePath}`);
      })
      .catch((err) => {
        logger.fatal(`Error executing command: ${err}`);
        process.exit(1);
      });
  });


// Add a basic check for arguments and show help if needed
if (process.argv.length <= 2) {
  console.log(program.helpInformation()); // Directly output help without triggering exit
  console.log(`Version: ${version}`);
  console.log(`Available commands: ${Object.keys(commandMap).join(', ')}`);
  process.exit(0);
} else {
  try {
    // Configure exit override to handle errors without recursion
    program.exitOverride((err) => {
      console.log(program.helpInformation()); // Output help text directly
      console.log(`Version: ${version}`);
      console.log(`Available commands: ${Object.keys(commandMap).join(', ')}`);
      logger.fatal(err);
      process.exit(1);
    });

    // Parse the command line arguments
    program.parse(process.argv);
  } catch (err: any) {
    console.log(program.helpInformation());
    console.log(`Version: ${version}`);
    console.log(`Available commands: ${Object.keys(commandMap).join(', ')}`);
    logger.fatal(err);
    process.exit(1);
  }
}

// Handle Ctrl+C (SIGINT)
process.on('SIGINT', async () => {
  try {
    logger.warn('Process interrupted by user. Cleaning up.');
    await executor.terminate();
    logger.fatal('Cleanup finished. Exiting now.');
    process.exit(0);
  } finally {
    logger.fatal('Cleanup failed. Exiting now.');
    process.exit(1);
  }
});