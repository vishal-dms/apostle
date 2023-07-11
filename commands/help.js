async function run(context) {
  // print out the help message of your plugin
  context.print.info('Help: Apostle is Amplify CLI plugin used to fix backend CloudFormation stacks that are stuck in UPDATE_ROLLBACK_FAILED status');
  context.print.info('Usage: amplify apostle continue-rollback <backend-env-name>')
}

module.exports = {
  run,
};
