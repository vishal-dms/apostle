const AWS = require('aws-sdk');
const eventName = 'PostPull';

function run(context, args) {
  // insert your code to handle the amplify cli PostPush event
  console.log(`Event handler ${eventName} to be implemented.`);
}
run()
module.exports = {
  run,
};
