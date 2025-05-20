const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runCommand(command, description) {
  console.log(`\n${description}...`);
  console.log(`$ ${command}`);
  
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.stderr || error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('Starting Whisper.cpp installation process...');
  
  // Update package list
  await runCommand('sudo apt update', 'Updating package list');
  
  // Install cmake
  await runCommand('sudo apt install cmake -y', 'Installing cmake');
  
  // Clone whisper.cpp repository
  await runCommand('git clone https://github.com/ggml-org/whisper.cpp.git', 'Cloning whisper.cpp repository');
  
  // Change directory
  process.chdir('whisper.cpp');
  
  // Download model
  await runCommand('sh ./models/download-ggml-model.sh tiny.en-q5_1', 'Downloading tiny.en-q5_1 model');
  
  // Build with cmake
  await runCommand('cmake -B build', 'Configuring build with cmake');
  await runCommand('cmake --build build --config Release', 'Building whisper.cpp');
  
  // Run whisper-cli with sample file
  await runCommand('./build/bin/whisper-cli -m models/ggml-tiny.en-q5_1.bin ./samples/jfk.wav', 'Running whisper-cli with JFK sample');
  
  console.log('\nProcess completed successfully!');
}

main();
