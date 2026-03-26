---
sidebar_position: 3
---
# Resource Configuration Tracking

AWS Config records and tracks the configuration of [supported AWS resources](https://docs.aws.amazon.com/config/latest/developerguide/resource-config-reference.html), creating an inventory of these resources in your AWS account along with their current and historical configurations. It also creates a timeline of configuration changes and maintains detailed information about resource attributes, relationships, and dependencies across your AWS infrastructure. Users can [view compliance history and timeline](https://docs.aws.amazon.com/config/latest/developerguide/view-manage-resource-console.html) either through the AWS Management Console or programmatically via AWS CLI, with the ability to query specific configuration states at any point in time.


![AWS Config Cost Visualization](/img/guides/config/resourcetimeline.png)

### Recording Frequency

AWS Config offers two recording frequency options that impact AWS resource visibility:

#### Continuous Recording
Continuously monitors and records every configuration change in your AWS environment in real-time. This provides comprehensive visibility into all resource modifications, allowing you to track and audit changes as they occur. Continuous recording is recommended for:
- Production environments with strict compliance requirements
- Critical infrastructure requiring immediate change detection
- Resources subject to regulatory compliance standards
- Security-sensitive workloads

#### Periodic Recording
Takes daily snapshots of your resource configurations, recording changes only when they differ from the previous 24-hour state. This approach offers a balance between oversight and cost efficiency. Periodic recording is suitable for:
- Development and testing environments
- Non-critical workloads with lower compliance requirements
- Highly dynamic resources (containers, auto-scaling groups)
- Cost-sensitive implementations

For detailed guidance on choosing the appropriate recording frequency, refer to the blog post on [Best Practices for Analyzing AWS Config Recording Frequencies](https://aws.amazon.com/blogs/mt/best-practices-for-analyzing-aws-config-recording-frequencies/). You can create one configuration recorder per region per account. The recorder can take a few minutes before configuration changes are captured again after stopping and restarting. Make changes to the configuration recorder during a maintenance window to account for the monitoring gap.

### Resource Exclusion

AWS Config offers [resource exclusion](https://docs.aws.amazon.com/config/latest/developerguide/select-resources.html) capability, allowing organizations to strategically manage resources to monitor. By excluding specific resource types that are less relevant to your risk profile or those generating high volumes of configuration items, you can significantly optimize operational noise while maintaining essential security monitoring.

Resource exclusion affects inventory tracking and compliance monitoring. If your environment requires Config for compliance monitoring or detecting shadow IT, approach resource exclusion with careful consideration and proper stakeholder involvement. Organizations should engage their security and operations teams to conduct a thorough assessment of which resources are critical for monitoring and compliance requirements. Before implementing any exclusions, review [AWS's Security Best Practices](https://docs.aws.amazon.com/config/latest/developerguide/security-best-practices.html) and consult the [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/).

We recommend excluding resource types only when you have a pre-determined steps to monitor for noises in aggregation. That includes Use in conjunction with a solutions like [Innovation Sandbox](https://aws.amazon.com/solutions/implementations/innovation-sandbox-on-aws/) to recycle your accounts on predetermined frequency. 

**Note**: When AWS Config integration is enabled in [AWS Control Tower](https://aws.amazon.com/controltower/), a service-linked Config recorder is deployed that restricts modifications to resource types required by enabled controls. To customize resource tracking beyond these constraints, follow the steps [outlined in this blog](https://aws.amazon.com/blogs/mt/customize-aws-config-resource-tracking-in-aws-control-tower-environment/), which provides a ready-to-use template on GitHub.

### Using Relationships in Recorded JSON

AWS Config captures resource relationships in the configuration item JSON, providing valuable context about how resources interact. There are two types of relationships:

#### Direct Relationships
- Straightforward A→B relationship extracted from a resource's configuration data
- Pulled directly from the describe API calls
- Example: The relationship between an Amazon EC2 instance and its security group is direct because the security groups are included in the describe API response for the EC2 instance

#### Indirect Relationships
- Older resource types might have their configuration recorded by examining multiple resources configurations
- Example: The relationship between a security group and an Amazon EC2 instance is indirect because describing a security group does not return any information about the instances it is associated with. In this case AWS Config creates two configuration items

You can learn more about what resources support indirect relationships [in this documentation](https://docs.aws.amazon.com/config/latest/developerguide/faq.html). To opt out of indirect relationships for cost optimization, reach out to your [Technical Account Manager](https://aws.amazon.com/premiumsupport/plans/enterprise/).

For more details on analyzing relationships and optimizing recording frequencies, see the blog post on [Best Practices for Analyzing AWS Config Recording Frequencies](https://aws.amazon.com/blogs/mt/best-practices-for-analyzing-aws-config-recording-frequencies/).

### API: ResourceCompliance

The [AWS::Config::ResourceCompliance](https://docs.aws.amazon.com/config/latest/developerguide/view-compliance-history.html) resource type provides a timeline view of compliance status in the AWS Config console. While it offers valuable insights, it can significantly increase configuration item costs, particularly when evaluating large numbers of resources.

For historical compliance checks, you can utilize AWS CloudTrail data as a cost-free alternative. Use the following query with Amazon Athena, third-party solutions, or AWS CloudTrail Lake:

```sql
SELECT
    eventTime, awsRegion, recipientAccountId, 
    element_at(additionalEventData, 'configRuleName') as configRuleName,
    json_extract_scalar(json_array_get(element_at(requestParameters,'evaluations'), 0), '$.complianceType') as Compliance,
    json_extract_scalar(json_array_get(element_at(requestParameters,'evaluations'), 0), '$.complianceResourceType') as ResourceType,
    json_extract_scalar(json_array_get(element_at(requestParameters,'evaluations'), 0), '$.complianceResourceId') as ResourceName
FROM $EDS_ID
WHERE eventName='PutEvaluations'
    AND eventTime > '2022-03-17 00:00:00'
    AND eventTime < '2022-03-18 00:00:00'
    AND json_extract_scalar(json_array_get(element_at(requestParameters,'evaluations'), 0), '$.complianceType') IN ('COMPLIANT','NON_COMPLIANT')
```

### Resource Type Coverage

AWS Config continuously expands support for new AWS resource types. Enable automatic inclusion of new resource types in your Config recorder settings to ensure comprehensive coverage as AWS releases new services.

For the complete list of supported resource types, see the [AWS Config supported resource types documentation](https://docs.aws.amazon.com/config/latest/developerguide/resource-config-reference.html).

### AWS Config custom resources

AWS Config allows you to extend its configuration tracking capabilities beyond supported AWS resources through [custom config resources.](https://docs.aws.amazon.com/config/latest/developerguide/customresources.html) This feature enables you to monitor non-supported AWS resources and track external resources such as on-premises servers, GitHub repositories, and other third-party resources. Once configured, you can publish third-party resource configuration data to AWS Config and view and monitor your complete resource inventory through the AWS Config console and APIs. Additionally, you can evaluate configuration compliance using AWS Config rules, conformance packs, best practices, internal policies, and regulatory requirements. 

Follow [this blog post](https://aws.amazon.com/blogs/mt/using-aws-config-custom-resources-to-track-any-resource-on-aws/) to learn how to monitor non-standard features using AWS Config. [This blog post](https://aws.amazon.com/blogs/mt/simplify-compliance-management-of-multicloud-or-hybrid-resources-with-aws-config/) provides walk-through on how to monitor resources hosted on other cloud providers.