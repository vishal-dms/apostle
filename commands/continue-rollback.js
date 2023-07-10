var colors = require('colors');
colors.enable()

const event = require("/Users/vishnaya/Documents/hackathon-23/HackDemoOne/amplify/team-provider-info.json");
const describe = require("../helpers/describe-stack-events.js");
const AWS = require("aws-sdk");
const environmentName = process.argv[4];
const stackName = event[environmentName]["awscloudformation"]["StackName"];
const region = event[environmentName]["awscloudformation"]["Region"];
const cloudformation = new AWS.CloudFormation({ region: region });
let params = {
  StackName: stackName,
};
async function isStackInRollbackFailed(stackName) {
  try {
    console.log("Fetching backend stack status...".grey)
    const data = await cloudformation.describeStacks(params).promise();
    const stack = data.Stacks[0];
    const stackStatus = stack.StackStatus;

    console.log("Stack Status:".red, stackStatus.red);

    return stackStatus === "UPDATE_ROLLBACK_FAILED";
  } catch (err) {
    // console.error("Failed to describe stack:", err);
    return false;
  }
}

async function isStackRolledBack(stackName) {
  try {
    const data = await cloudformation.waitFor('stackRollbackComplete', params).promise();
    console.log("\nROLLBACK COMPLETE".green);
  } catch (err) {
    // console.error("Failed to describe stack:", err);
    return false;
  }
}

async function run(context) {
  console.log("Environment Name: ".green, environmentName)
  console.log(
    "Backend Stack Name: ".green,
    stackName
  );
  if (await isStackInRollbackFailed(stackName)) {
    console.log("\nInitiating check for failed resources...".grey)
    const failedResource = await describe.checkfailedvents(stackName, region);
    console.log("\nFound nested resource of rollback failure...".yellow)
    console.log("\nResource stack:", failedResource[0].StackName.red)
    console.log("Logical ID:", failedResource[0].LogicalResourceId.red)
    console.log("Rollback failure reason:", failedResource[0].ResourceStatusReason.red) 
    params.ResourcesToSkip = [
      failedResource[0].StackName + "." + failedResource[0].LogicalResourceId,
    ];
    console.log("\nNow fixing stack...".grey);
    console.log("\nTrigerred a rollback on the root stack...".green)
    const data = await cloudformation.continueUpdateRollback(params).promise();
    if(isStackRolledBack(stackName)) {
      console.log("ROLLBACK COMPLETE".magenta);
      console.log("\nYou can now interact using Amplify CLI commands !!!".green)
    }
  }
}

module.exports = {
  run,
};
