---
sidebar_position: 6
---
# Cost Optimization

### Pricing Overview

[AWS Config pricing](https://aws.amazon.com/config/pricing/) is primarily based on two main dimensions:

1. Configuration Item Recording : 

    * Continuous Recording
        Continuously monitors and records every configuration change in your AWS environment in real-time. This provides comprehensive visibility into all resource modifications, allowing you to track and audit changes as they occur. 
    * Periodic Recording
        Takes daily snapshots of your resource configurations, recording changes only when they differ from the previous 24-hour state. This approach offers a balance between oversight and cost efficiency, capturing significant changes while reducing data volume. 

1. Rule and Conformance Pack Evaluations:
    AWS Config charges for config rule evaluations, individual or as part of a conformance pack.

For current details on AWS Config pricing, [please refer to this link](https://aws.amazon.com/config/pricing/).

While the above are the primary pricing components, other factors can influence the total cost of using AWS Config:

1. [AWS Lambda](https://aws.amazon.com/lambda/pricing/) costs: If you're using custom rules implemented via Lambda functions, standard Lambda pricing applies.
2. [Amazon S3](https://aws.amazon.com/s3/pricing/) storage: Costs are incurred for storing configuration snapshots and history files in S3.
3. Data Transfer: Charges may apply for data transfer between AWS services or regions.



### Configuration Item

#### Analyzing Config Costs

[AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/) provides insights into AWS Config costs by filtering service usage and analyzing cost dimensions.  To do so, navigate to your  [Billing and Cost Management console](https://us-east-1.console.aws.amazon.com/costmanagement/home#/home) and select **Cost Explorer** from left panel. From right panel, configure parameters such as your desired time and choose your preferred granularity based on the level of detail you need. Select **Usage Type** from **Dimensions** under **Group by** section. Under **Filters**, navigate to **Service** and choose **Config**.

![AWS Config Cost Visualization](/img/guides/config/configcost.png)

[Amazon CloudWatch's](https://aws.amazon.com/cloudwatch/) "ConfigurationItemsRecorded" metric helps identify resource types generating the most configuration items. For detailed analysis, [Amazon Athena](https://aws.amazon.com/athena/) can be used to query [Cost and Usage Reports](https://aws.amazon.com/aws-cost-management/aws-cost-and-usage-reporting/) with [AWS CloudTrail](https://aws.amazon.com/cloudtrail/) and [CloudTrail Lake](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-lake.html) to help estimate config recorder costs and track frequently evaluated rules. Please refer to blog on how to [use Athena to Analyze AWS Config Data](https://aws.amazon.com/blogs/mt/use-amazon-athena-and-aws-cloudtrail-to-estimate-billing-for-aws-config-rule-evaluations/)

For cost alerts, implement proactive cost management through [AWS Budgets](https://aws.amazon.com/aws-cost-management/aws-budgets/) when costs exceed predefined thresholds.  Also, [AWS Cost Anomaly Detection](https://aws.amazon.com/aws-cost-management/aws-cost-anomaly-detection/) service provides continuous monitoring for unusual spending patterns, making it easier to identify and address cost spikes quickly. You can also create [CloudWatch billing alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/monitor_estimated_charges_with_cloudwatch.html) that notify you when your estimated charges exceed a defined threshold.  

#### Choosing Between Continuous and Periodic Recording

The choice between continuous and periodic recording significantly impacts AWS Config costs. For comprehensive guidance on recording frequency options, use cases, and cost implications, see the [Recording Frequency section](../Resource%20Configuration%20Tracking/index.md#recording-frequency) in Resource Configuration Tracking.

Key cost considerations:
- **Continuous recording**: Can be more cost-effective for static workloads
- **Periodic recording**: Can be more cost-effective for highly dynamic workloads, but cost per configuration item is higher

Use the blog post on [Best Practices for Analyzing AWS Config Recording Frequencies](https://aws.amazon.com/blogs/mt/best-practices-for-analyzing-aws-config-recording-frequencies/) for detailed cost analysis. Based on the analysis, determine if your environment can benefit from periodic recording. When choosing recording type for cost optimization purpose, it is important to understand how your accounts and environments are setup, and determine total Configurations Items generated per resource types per account per region. 

In general, your risk management process influences the AWS Config recording cost. As an example, if your sandbox environment is setup for 1 week retention and you have full lifecycle tactic and risk management process to ensure sandbox is destroyed in 1 week, your need to monitor environment can be more selective. However, if your sandbox has 1 week retention guidance and driven primary by user, your recording may be more granular. 

Similarly, your recording approach can change if you have dedicated account and use-case defined for ephemeral resources than if you have ephemeral resources alongside static resources for the same risk tolerance level. 


#### Resource Exclusion

AWS Config [resource exclusion](https://docs.aws.amazon.com/config/latest/developerguide/select-resources.html) that can optimize AWS Config cost while maintaining essential security monitoring. Excluding resource types from recorder generates less Configuration Items, which optimize costs of running AWS Config. By excluding resource types, you also turn off continuous rule evaluation that can optimize cost.

For detailed information on resource exclusion strategies and implementation, see the [Resource Exclusion section](../Resource%20Configuration%20Tracking/index.md#resource-exclusion) in Resource Configuration Tracking.


#### Top Configuration Items

The [AWS::Config::ResourceCompliance](https://docs.aws.amazon.com/config/latest/developerguide/view-compliance-history.html) resource type can be one of the most impactful configuration item generators, especially for customers with numerous rule evaluations. 

**ResourceCompliance Cost Impact:**
- **Cannot be disabled selectively**: ResourceCompliance recording is all-or-nothing. You cannot disable it for specific rules or resources.
- **Generates CI for every evaluation**: Even if compliance status is unchanged, a new configuration item is created with each evaluation.
- **No retention policy**: ResourceCompliance configuration items grow indefinitely unless you implement custom S3 lifecycle policies.
- **Multiplier effect**: With 100 rules evaluating 1,000 resources daily, you generate 100,000 ResourceCompliance CIs per day (3M/month).

For detailed information on ResourceCompliance costs and CloudTrail alternatives, see the [API: ResourceCompliance section](../Resource%20Configuration%20Tracking/index.md#api-resourcecompliance) in Resource Configuration Tracking.



#### AWS Config Indirect Relationship

For detailed information on direct and indirect relationships and their cost implications, see the [Using Relationships in Recorded JSON section](../Resource%20Configuration%20Tracking/index.md#using-relationships-in-recorded-json) in Resource Configuration Tracking. Understanding these relationships is crucial for optimizing Config costs while maintaining necessary visibility into resource dependencies.

#### Rule Management and Evaluation Considerations 

When managing rule lifecycles, deletions, and re-evaluations to minimize cost impact, see the [Rule Deletion Best Practices](../Compliance%20Management/index.md#rule-deletion-best-practices) and [Re-evaluation Strategies](../Compliance%20Management/index.md#re-evaluation-strategies) sections in Compliance Management.

#### API Call Optimization 

Efficient API operations can reduce AWS Config costs. When modifying resources, such as adding multiple tags to an [EC2 instance](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Using_Tags.html), it's recommended to consolidate changes into a single API call rather than making multiple individual calls. For example, adding 10 tags in one API call is more efficient than making 10 separate calls, as each call generates both an API change record and a resource compliance configuration item.

#### Custom Rules and Lambda Function Optimization 

For custom rule implementation strategies, including Guard vs Lambda trade-offs and optimization techniques, see the [AWS CloudFormation Guard](../Compliance%20Management/index.md#aws-cloudformation-guard) and [Custom Evaluation](../Compliance%20Management/index.md#custom-evaluation) sections in Compliance Management.

Key Considerations:
* Narrowing the scope of evaluated resources using specific targeting. Scope based rules are only supported for event-based evaluations not periodic 
* Implementing resource tagging for better control
* Adding logic to handle the termination of evaluation for deleted resources
* Using resource-specific triggers rather than evaluating all resources

#### Conformance Pack and Rule Deduplication 

Regular auditing of rules and [conformance packs](https://docs.aws.amazon.com/config/latest/developerguide/conformance-packs.html) is essential to eliminate redundancy.  For instance, if multiple conformance packs include the same rule (such as CloudTrail enablement checks) that's already being evaluated by [AWS Security Hub](https://aws.amazon.com/security-hub/), consider removing the duplicate rules to avoid unnecessary evaluation costs. Review and consolidate overlapping rules across different compliance standards to maintain effectiveness while optimizing costs. Please follow [this blog to discover duplicate AWS Config rules](https://aws.amazon.com/blogs/security/discover-duplicate-aws-config-rules-for-streamlined-compliance/).

#### Optimizing Global Resource Recording in AWS Config

When implementing AWS Config across multiple regions, you can optimize the recording of global resources to control costs and prevent duplicate data collection. The best practice is to limit global resource recording to a single region within your AWS environment. This can be managed through AWS CloudFormation templates by setting the 'IncludeGlobalResourceTypes' property to 'true' in only one designated region. This approach is important for resources like IAM users, roles, and policies that are global in nature. By implementing this approach, organizations can avoid unnecessary duplication of global resource recording across multiple regions, leading to significant cost savings while maintaining comprehensive visibility into their global resources. 

#### Integrated Services Cost Optimization 

AWS Config interacts with various AWS services, each contributing to the overall cost. Key optimization strategies:

- **Amazon S3**: Use S3 Intelligent-Tiering for Config delivery channel storage, implement lifecycle policies to transition configuration snapshots to IA after 30 days and Glacier after 90 days
- **Amazon SNS**: Optimize notification frequency and filter unnecessary alerts to reduce SNS costs
- **AWS Lambda**: For custom rules, use efficient code and appropriate memory allocation to minimize execution costs
- **Amazon CloudWatch**: Monitor Config-related metrics and set up cost-effective alerting thresholds

For service-specific optimization guidance, refer to each service's cost optimization documentation.