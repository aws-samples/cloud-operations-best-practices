---
sidebar_position: 3
---
# Best Practices for CloudTrail Lake event enrichment

CloudTrail event enrichment allows you to enhance management and data events by adding resource tag keys, and IAM global condition keys, including principal tag keys,  when creating or updating an event data store. This enrichment enables better categorization, searching, and analysis of CloudTrail events based on business context, such as cost allocation, financial management, operations, and data security requirements. The enriched events include an eventContext field that provides contextual information for API actions, which you can analyze by running queries in CloudTrail Lake or through federation with Amazon Athena. This feature helps organizations better understand and track their AWS resource usage and security posture by incorporating additional metadata about resources~~, principals~~, and authorization conditions into their event logs.

### Resource Tag Enrichment

* Configure resource tag keys during event data store creation or updates to categorize and analyze events based on business context
* Consider that resource tags added after resource creation may experience delays before appearing in CloudTrail events
* Be aware that resource tags for deleted resources might not include tag information
* Understand that tags applied at resource creation time experience minimal or no delays

### IAM Global Condition Keys Enrichment

* Select relevant IAM global condition keys to include additional context about authorization processes
* Remember that configured condition keys may not appear in every event if they weren't relevant to the IAM policy evaluation
* Consider using [supported condition keys](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-context-events.html#condition-keys-supported-services) like:
    * aws:FederatedProvider
    * aws:MultiFactorAuthPresent
    * aws:PrincipalAccount
    * aws:PrincipalType
    * aws:ViaAWSService
    * aws:SecureTransport
    * And many others ([Supported IAM global condition keys for enriched events](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-context-events.html#condition-keys-supported-services))

### Service Considerations

* Be aware of [services](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-context-events.html#resource-tags-supported-services) that may experience delays in resource tag updates, including:
    * Amazon S3
    * AWS CloudTrail
    * AWS Lambda
    * Amazon DynamoDB
    * AWS Organizations
    * AWS KMS
    * Amazon SQS
    * And many others (the [AWS documentation](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-context-events.html#resource-tags-supported-services) lists additional services)

### Event Context Management

* Monitor the eventContext field in CloudTrail events for enriched information
* Note that the eventContext field will only be present in events for event data stores configured with enrichment
* Be aware that delayed events will not include eventContext data. Events that have delayed delivery contains an “addendum“ field that shows information about why the event was delayed. Read more about [CloudTrail events records](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-event-reference-record-contents.html).
* Maintain the AWSServiceRoleForCloudTrailEventContext service-linked role to ensure proper tag population
* Adding event context can increase the overall size of the event which can lead to additional ingestion cost for CloudTrail Lake

### Operational Considerations

* Plan for potential service outages that may cause delays in resource tag updates
* Monitor addendum fields in CloudTrail events that include information about resource tag changes after service outages
* Understand that events in Event history, EventBridge, and trails will not include the eventContext field
* Consider the business requirements for cost allocation, operations, and security when selecting tag keys and condition keys for enrichment

### Sample SQL Queries for CloudTrail Lake

#### **Resource Tags for Event Enrichment**

```
SELECT eventtime, eventName, substr(userIdentity.arn, strpos(userIdentity.arn, '/') +1) as IAM,
eventContext.tagContext.resourceTags[1].tags as tags,
eventContext.tagContext.resourceTags[1].arn as resourceArn, 
element_at(requestParameters, 'key') as S3Object
FROM $EDS_ID
WHERE eventContext IS NOT NULL 
and eventSource = 's3.amazonaws.com'
and eventname in ('DeleteObject', 'PutObject')
AND eventtime >= '2025-05-30 00:00:00'
AND eventtime <= '2025-05-30 23:59:59'
```

#### **Resource Tags for Event Enrichment on Data Classification Tag**

```
SELECT eventtime, eventName, substr(userIdentity.arn, strpos(userIdentity.arn, '/') +1) as IAM,
element_at(eventContext.tagContext.resourceTags[1].tags, 'DataClassification') as DataClassification,
eventContext.tagContext.resourceTags[1].arn as resourceArn, 
element_at(requestParameters, 'key') as S3Object
FROM $EDS_ID
WHERE eventContext IS NOT NULL
and element_at(eventContext.tagContext.resourceTags[1].tags, 'DataClassification') = 'sensitive'
and eventSource = 's3.amazonaws.com'
and eventname in ('DeleteObject', 'PutObject')
AND eventtime >= '2025-05-12 00:00:00'
AND eventtime <= '2025-05-16 23:59:59'
```

#### **Sample Query to create a Visualization Chart for Event Enrichment**

```
SELECT count(*) as count, eventName, substr(userIdentity.arn, 
strpos(userIdentity.arn, '/') +1) as IAM,
element_at(eventContext.tagContext.resourceTags[1].tags, 'DataClassification') as DataClassification,
eventContext.tagContext.resourceTags[1].arn as resourceArn, 
element_at(requestParameters, 'key') as S3Object
FROM $EDS_ID
WHERE eventContext IS NOT NULL
and element_at(eventContext.tagContext.resourceTags[1].tags, 'DataClassification') = 'sensitive'
and eventSource = 's3.amazonaws.com'
and eventname in ('DeleteObject', 'PutObject')
AND eventtime >= '2025-05-12 00:00:00'
AND eventtime <= '2025-05-16 23:59:59'
Group BY eventName,
substr(userIdentity.arn, strpos(userIdentity.arn, '/') +1),
element_at(eventContext.tagContext.resourceTags[1].tags, 'DataClassification'),
eventContext.tagContext.resourceTags[1].arn,
element_at(requestParameters, 'key')
```

