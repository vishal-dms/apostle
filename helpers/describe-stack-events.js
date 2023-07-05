const AWS = require('aws-sdk');

function isUpdateFailedEvent(event) {
  return event.ResourceStatus === 'UPDATE_FAILED'
}

// Function to check if an event indicates an update rollback failure
function isUpdateRollbackInProgressEvent(event, stackName) {
  return event.ResourceStatus === 'UPDATE_ROLLBACK_IN_PROGRESS' && event.LogicalResourceId === stackName && event.ResourceStatusReason != 'User Initiated'
}

  let updateRollbackFailedEvent = {};
  let resourcesToSkip = [];
// Retrieve stack events using AWS SDK

module.exports.checkfailedvents = async (stackName, region) => {
  //console.log("Inside CheckFailedEvents : ", stackName)
  const cloudFormation = new AWS.CloudFormation({region: region} );
  let nextToken = null;
  let updateRollbackInProgressEncountered = false;

  while (!updateRollbackInProgressEncountered) {
    //console.log("Inside While")
    const params = {
      StackName: stackName,
      NextToken: nextToken
    };
    //console.log("After Param")
    const response = await cloudFormation.describeStackEvents(params).promise();
    // response.StackEvents.forEach(event => console.log("Logical Resource ID: ", event['LogicalResourceId'], "Resource Status:", event['ResourceStatus'], "Timestamp: ", event['Timestamp']));
    //console.log("After Client")
    nextToken = response.NextToken;

    for (const event of response.StackEvents) {
      //console.log("Inside FOR")
      if (isUpdateRollbackInProgressEvent(event, stackName)) {
        updateRollbackInProgressEncountered = true;
        // console.log(updateRollbackFailedEvent)
        // console.log("\n\n######")
        // console.log("Logical Resource ID: ", updateRollbackFailedEvent['LogicalResourceId'], "\nResource Status:", updateRollbackFailedEvent['ResourceStatus'], "\nResource Status Reason:", updateRollbackFailedEvent['ResourceStatusReason'], "\nTimestamp: ", updateRollbackFailedEvent['Timestamp'] );
        resourcesToSkip.push(updateRollbackFailedEvent);
        if(updateRollbackFailedEvent['ResourceType'] === 'AWS::CloudFormation::Stack') {
          stackName = updateRollbackFailedEvent['PhysicalResourceId'].split('/')[1]
          updateRollbackInProgressEncountered = false
        }
        break
      } 
      else if (isUpdateFailedEvent(event)) {
        updateRollbackFailedEvent = event
        continue
      } 

    }

  }
  //console.log(resourcesToSkip)
  return resourcesToSkip.slice(-1)
};