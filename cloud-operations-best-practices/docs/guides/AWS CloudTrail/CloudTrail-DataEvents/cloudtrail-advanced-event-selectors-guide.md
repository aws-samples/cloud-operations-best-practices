---
sidebar_position: 14
---
# Advanced Event Selectors

### Understanding Advanced Event Selectors

Advanced event selectors in AWS CloudTrail provide granular control over which data events are logged, advanced event selectors allow you to specify specific conditions using field-based filtering with operators like equals, not equals, starts with, and ends with. This granular approach enables organizations to capture only the data events that matter for their security, compliance, and operational requirements while reducing costs associated with excessive event logging.

Advanced event selectors consist of field selectors, operators, and values. Each selector contains an array of field selectors that define the filtering criteria, with each field selector specifying a field name (such as eventCategory, eventName, or resources.type), an operator (equals, notEquals, startsWith, endsWith), and one or more values to match against. The relationship between multiple field selectors within a single advanced event selector is logical AND, meaning all conditions must be met for an event to be included.

![CloudTrail Advanced Event Selectors](/img/guides/cloudtrail-lake/cloudtrail-data-events-advanced-selector.png "Advanced Event Selectors for Data Events")

### Supported Fields and Operators

CloudTrail advanced event selectors support a comprehensive set of fields that cover all aspects of AWS API calls for data events. The primary fields include eventName for specific API operations, resources.type for AWS resource types, resources.ARN for specific resource identifiers, and readOnly for distinguishing between read and write operations. Each field supports specific operators: equals and notEquals work with exact matches, while startsWith and endsWith enable pattern-based filtering. Understanding these combinations is crucial for creating effective filtering strategies.

The following will provide examples on how advanced event selectors can be used to filter for specific data events related to your AWS resources.

### Amazon S3

#### Critical Write Operations Filter

This filter focuses on high-risk S3 operations that could indicate data exfiltration, unauthorized modifications, or compliance violations. By monitoring only write operations on sensitive buckets, organizations can detect malicious activity while reducing the log volume of S3 events. This approach is essential for maintaining security visibility without overwhelming security teams with routine read operations.

```json
[
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::S3::Object"]
      },
      {
        "Field": "eventName",
        "Equals": ["DeleteObject", "PutObject", "RestoreObject"]
      },
      {
        "Field": "resources.ARN",
        "StartsWith": ["arn:aws:s3:::sensitive-bucket/", "arn:aws:s3:::compliance-bucket/"]
      }
    ]
  }
]
```

### AWS Lambda Function Monitoring

#### Production Function Invocation Filter

Lambda invocation monitoring is crucial for detecting unauthorized function execution and unusual access patterns. This filter targets lambda function that start with the naming patterns for production and critical functions while excluding development naming pattern environments, reducing noise and focusing on business-critical activities. The pattern-based ARN filtering automatically covers new functions that follow naming conventions, providing scalable security monitoring.

```json
[
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::Lambda::Function"]
      },
      {
        "Field": "eventName",
        "Equals": ["Invoke"]
      },
      {
        "Field": "resources.ARN",
        "StartsWith": ["arn:aws:lambda:us-east-1:123456789012:function:prod-", "arn:aws:lambda:us-east-1:123456789012:function:critical-"]
      }
    ]
  }
]
```

### DynamoDB Table Operations

#### Write Operations and Sensitive Table Filter

DynamoDB generates high volumes of events, making selective filtering essential for cost control and security focus. These filters capture data modification events that could indicate unauthorized access or data tampering while excluding routine read operations. The combination approach in the following example allows the monitoring of specific write operations for specific tables and all operations on sensitive tables that are defined, providing comprehensive coverage without excessive costs.

```json
[
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::DynamoDB::Table"]
      },
      {
        "Field": "eventName",
        "Equals": ["PutItem", "UpdateItem", "DeleteItem", "BatchWriteItem"]
      },
      {
        "Field": "resources.ARN",
        "Equals": ["arn:aws:dynamodb:us-east-1:123456789012:table/UserData"]
      }
    ]
  },
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::DynamoDB::Table"]
      },
      {
        "Field": "resources.ARN",
        "StartsWith": ["arn:aws:dynamodb:us-east-1:123456789012:table/Financial"]
      }
    ]
  }
]
```

### Amazon SQS Queue Monitoring

#### Administrative Operations Filter

SQS administrative operations can represent certain security risk as they can disrupt message flow and modify queue permissions. This filter example focuses on queue management activities that could indicate privilege escalation or service disruption attempts. By excluding high-volume message operations, this approach reduces logging costs while maintaining visibility into security-relevant administrative changes.

```json
[
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::SQS::Queue"]
      },
      {
        "Field": "eventName",
        "Equals": ["CreateQueue", "DeleteQueue", "SetQueueAttributes", "AddPermission", "RemovePermission"]
      }
    ]
  }
]
```

### Amazon SNS Topic Operations

#### Topic Management and Critical Topic Filter

SNS monitoring requires balancing administrative oversight with message flow visibility for critical topics. These filters capture topic management operations that could affect notification delivery and monitor all activities on security-sensitive topics. The multi-selector approach allows comprehensive monitoring of critical communication channels while reducing overall log volume through selective topic filtering.

```json
[
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::SNS::Topic"]
      },
      {
        "Field": "eventName",
        "Equals": ["CreateTopic", "DeleteTopic", "Subscribe", "Unsubscribe", "SetTopicAttributes"]
      }
    ]
  },
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::SNS::Topic"]
      },
      {
        "Field": "resources.ARN",
        "Equals": ["arn:aws:sns:us-east-1:123456789012:security-alerts"]
      }
    ]
  },
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::SNS::Topic"]
      },
      {
        "Field": "resources.ARN",
        "StartsWith": ["arn:aws:sns:us-east-1:123456789012:compliance-"]
      }
    ]
  }
]
```

### User Identity-Based Filters

#### Privileged User Monitoring Filter

User identity filtering allows you to include or exclude events for actions taken by specific IAM identities. The following example demonstrates two approaches: excluding specific service roles from S3 object logging to reduce noise from automated processes, and monitoring only privileged roles for DynamoDB table operations to focus on high-risk activities.

```json
[
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::S3::Object"]
      },
      {
        "Field": "userIdentity.arn",
        "NotEquals": ["arn:aws:sts::123456789012:assumed-role/service-role/backup-automation-role", "arn:aws:sts::123456789012:assumed-role/service-role/monitoring-role"]
      }
    ]
  },
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::DynamoDB::Table"]
      },
      {
        "Field": "userIdentity.arn",
        "StartsWith": ["arn:aws:sts::123456789012:assumed-role/AdminRole/", "arn:aws:sts::123456789012:assumed-role/SecurityRole/"]
      }
    ]
  }
]
```

### Additional Supported Field Examples

#### Write Operations Filter

The readOnly field filter is crucial for focusing on events that represent actual changes to your environment. By filtering for write operations only, organizations can reduce log volume while maintaining visibility into all actions that could impact security or compliance. This filter is particularly effective when combined with specific resource types or event sources.

#### Service-Specific Event Source Filter

Event source filtering allows targeted monitoring of specific AWS services without the complexity of resource-type filtering. This approach is ideal for compliance scenarios where certain services require comprehensive logging regardless of the specific resources involved. The filter significantly reduces cross-service noise while ensuring complete coverage of designated services.

#### Specific API Operation Monitoring

Event name filtering provides the most granular control over CloudTrail logging, allowing organizations to monitor specific API operations across all services. This approach is valuable for detecting specific attack patterns, monitoring critical operations, or meeting precise compliance requirements. The filter dramatically reduces log volume while providing surgical visibility into high-risk operations.

#### Resource Type Combination Filtering

Combining resource type filtering with operation type filtering creates powerful, targeted monitoring capabilities. The following example demonstrates three different approaches: monitoring write operations on S3 objects, capturing specific DynamoDB write operations, and logging write operations on S3 buckets. This combination allows organizations to monitor specific types of resources for specific types of operations, providing precise security coverage while minimizing unnecessary logging.

```json
[
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::S3::Object"]
      },
      {
        "Field": "readOnly",
        "Equals": ["false"]
      }
    ]
  },
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::DynamoDB::Table"]
      },
      {
        "Field": "eventName",
        "Equals": ["PutItem", "UpdateItem", "DeleteItem"]
      }
    ]
  },
  {
    "FieldSelectors": [
      {
        "Field": "eventCategory",
        "Equals": ["Data"]
      },
      {
        "Field": "resources.type",
        "Equals": ["AWS::S3::Bucket"]
      },
      {
        "Field": "readOnly",
        "Equals": ["false"]
      }
    ]
  }
]
```

## Cost Optimization Strategies

### Event Volume Analysis and Reduction

Effective cost optimization begins with understanding your current event volume and identifying opportunities for reduction without compromising security or compliance requirements. Analyze your CloudTrail logs to identify high-volume events and determne which events can be safely excluded. This analysis can help you determin your advanced event selector strategy.

### Strategic Filtering Approaches

Implement a layered filtering approach that prioritizes security and compliance events while progressively filtering out routine operational activities. Start with broad inclusion criteria for security-relevant events, then add specific exclusions for known routine operations. For example, include all write operations but exclude specific automated processes that generate predictable, low-risk events. Use the startsWith and endsWith operators to create pattern-based filters that can efficiently exclude entire categories of routine events while maintaining coverage of unexpected or potentially malicious activities.

### Resource-Based Cost Management

Organize your filtering strategy around resource criticality and sensitivity levels. Implement comprehensive logging for production resources, sensitive data stores, and security-critical services while applying more aggressive filtering to development and testing environments. Use resource ARN patterns to automatically apply appropriate logging levels based on naming conventions. This approach ensures that cost optimization efforts don't compromise security monitoring for your most important assets while reducing unnecessary logging overhead for less critical resources.

## Security and Compliance Considerations

### Maintaining Security Visibility

While optimizing costs through advanced event selectors, maintaining comprehensive security visibility remains paramount. Ensure that your filtering strategy captures all events that could indicate security incidents. Regular review and testing of your event selectors ensures that security monitoring capabilities remain effective as your environment evolves.

### Compliance Requirements Integration

Different compliance frameworks have specific requirements for audit logging that must be considered when designing advanced event selectors. Map your compliance requirements to specific CloudTrail events and ensure that your advanced event selectors capture all necessary activities. Document your filtering decisions and maintain evidence that your logging strategy meets regulatory requirements.

### Incident Response Preparedness

Design your advanced event selectors with incident response requirements in mind, ensuring that you capture sufficient detail to support forensic analysis and threat hunting activities. Include events that provide context around security incidents, such as authentication events, network access patterns, and resource configuration changes. Consider the timeline requirements for incident response and ensure that your logging strategy provides adequate historical data for investigation purposes. Test your event selectors against known incident scenarios to validate that they capture the necessary information for effective response.

## Implementation Best Practices

### Phased Deployment Strategy

Implement advanced event selectors using a phased approach that allows for testing and refinement before full deployment. Start with a pilot implementation in a non-production environment to validate your filtering logic and measure the impact on event volume and costs. Gradually expand the implementation while monitoring the effectiveness of your filtering strategy. This approach allows you to identify and address issues before they impact your production logging capabilities and provides opportunities to refine your selectors based on real-world usage patterns.

### Monitoring and Validation

Establish comprehensive monitoring for your CloudTrail advanced event selectors to ensure they continue to meet your security and compliance requirements over time. Implement automated validation checks that verify your event selectors are capturing expected events and not inadvertently excluding critical activities. Regular review of your filtering effectiveness helps maintain the balance between cost optimization and security visibility.

## Advanced Filtering Techniques

### Pattern-Based Resource Filtering

Leverage the startsWith and endsWith operators to create sophisticated pattern-based filters that can efficiently manage large numbers of resources. For example, use naming conventions in your resource ARNs to automatically apply appropriate logging levels based on environment, sensitivity, or business unit. Pattern-based filtering is particularly effective for organizations with consistent naming standards and can significantly reduce the complexity of managing event selectors across large AWS environments. This approach also provides automatic coverage for new resources that follow established naming patterns.

### Multi-Condition Logic Implementation

Advanced event selectors support complex logical conditions that can be used to create sophisticated filtering rules. Combine multiple field selectors within a single advanced event selector to create AND conditions, or use multiple advanced event selectors to create OR conditions. For example, you might create a selector that captures all write operations on sensitive resources OR any operations performed by privileged users. Understanding how to effectively combine conditions allows you to create precise filtering rules that capture exactly the events you need while excluding everything else.
