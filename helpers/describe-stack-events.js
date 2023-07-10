const AWS = require("aws-sdk");

// Function to check if an event indicates an update failed
function isUpdateFailedEvent(event) {
  return event.ResourceStatus === "UPDATE_FAILED";
}

// Function to check if an event indicates an update rollback failure
function isUpdateRollbackInProgressEvent(event, stackName) {
  return (
    event.ResourceStatus === "UPDATE_ROLLBACK_IN_PROGRESS" &&
    event.LogicalResourceId === stackName &&
    event.ResourceStatusReason != "User Initiated"
  );
}

let updateRollbackFailedEvent = {};
let resourcesToSkip = [];

// Retrieve stack events using AWS SDK
module.exports.checkfailedvents = async (stackName, region) => {
  const cloudFormation = new AWS.CloudFormation({ region: region });
  let nextToken = null;
  let updateRollbackInProgressEncountered = false;

  while (!updateRollbackInProgressEncountered) {
    const params = {
      StackName: stackName,
      NextToken: nextToken,
    };
    console.log("Scanning Stack: ".cyan,params.StackName);
    const response = await cloudFormation.describeStackEvents(params).promise();
    nextToken = response.NextToken;
    for (const event of response.StackEvents) {
      if (isUpdateRollbackInProgressEvent(event, stackName)) {
        updateRollbackInProgressEncountered = true;

        console.log("\tFailed Resource: ",updateRollbackFailedEvent.LogicalResourceId.red);
        resourcesToSkip.push(updateRollbackFailedEvent);
        if (
          updateRollbackFailedEvent["ResourceType"] ===
          "AWS::CloudFormation::Stack"
        ) {
          console.log("\tResource Type:", "Stack".red)
          console.log("\nNow scanning nested stack...".grey)
          stackName =
            updateRollbackFailedEvent["PhysicalResourceId"].split("/")[1];
          updateRollbackInProgressEncountered = false;
        }
        break;
      } else if (isUpdateFailedEvent(event)) {
        updateRollbackFailedEvent = event;
        continue;
      }
    }
  }
  return resourcesToSkip.slice(-1);
};
