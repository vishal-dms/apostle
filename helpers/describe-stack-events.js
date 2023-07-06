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
    const response = await cloudFormation.describeStackEvents(params).promise();
    nextToken = response.NextToken;
    for (const event of response.StackEvents) {
      if (isUpdateRollbackInProgressEvent(event, stackName)) {
        updateRollbackInProgressEncountered = true;
        resourcesToSkip.push(updateRollbackFailedEvent);
        if (
          updateRollbackFailedEvent["ResourceType"] ===
          "AWS::CloudFormation::Stack"
        ) {
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
