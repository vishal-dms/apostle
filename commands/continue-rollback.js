//import event from "../amplify/team-provider-info.json" assert { type: "json" };
const event = require("./amplify/team-provider-info.json");
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
    const data = await cloudformation.describeStacks(params).promise();
    const stack = data.Stacks[0];
    const stackStatus = stack.StackStatus;

    console.log("Stack Status:", stackStatus);

    return stackStatus === "UPDATE_ROLLBACK_FAILED";
  } catch (err) {
    console.error("Failed to describe stack:", err);
    return false;
  }
}

async function run(context) {
  console.log(
    "Printing Stack Name ",
    event[environmentName]["awscloudformation"]["StackName"]
  );
  if (await isStackInRollbackFailed(stackName)) {
    const failedResource = await describe.checkfailedvents(stackName, region);
    console.log(failedResource);
    params.ResourcesToSkip = [
      failedResource[0].StackName + "." + failedResource[0].LogicalResourceId,
    ];
    console.log(params);
    const data = await cloudformation.continueUpdateRollback(params).promise();
  }
}

module.exports = {
  run,
};
