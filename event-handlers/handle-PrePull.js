const eventName = 'PrePull';

async function run(context, args) {
  // insert your code to handle the amplify cli PrePull event
  context.print.info(`Event handler ${eventName} to be implemented.`);
}

module.exports = {
  run,
};
