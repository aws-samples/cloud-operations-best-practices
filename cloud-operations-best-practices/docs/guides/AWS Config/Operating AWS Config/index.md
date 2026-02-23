---
sidebar_position: 1
---
# Setup and Operations


### AWS Config recorder settings

When configuring AWS Config recorder settings, an important best practice is to enable tracking for [all resource types](https://docs.aws.amazon.com/config/latest/developerguide/select-resources.html). The additional benefit of enabling all resources is the automatic inclusion of new AWS services resource types as they become available for Config tracking, ensuring your configuration management stays current without manual intervention.

Regarding [global resources](https://docs.aws.amazon.com/config/latest/developerguide/select-resources.html#select-resources-global), such as [IAM](https://aws.amazon.com/iam/), it's important to enable recording in only one region (AWS Config should be enabled in the customer's home or main region). This configuration serves two purposes: it prevents duplicate configuration items and helps avoid unnecessary costs. If you enable global resource recording in multiple regions, you'll encounter redundant configuration tracking and incur additional expenses for monitoring the same global resources multiple times. For example, when tracking IAM users, roles, and policies, you should designate a primary region (such as us-east-1) for global resource recording and disable this feature in all other regions.


#### Recorder Health Monitoring

Monitor your AWS Config recorder health to ensure continuous compliance tracking. Use the `DescribeConfigurationRecorderStatus` API to programmatically check if your recorder is actively recording configuration changes and identify any error conditions. For automated monitoring, create CloudWatch alarms based on custom metrics that track recorder status across your accounts and regions. Additionally, configure SNS notifications through your Config delivery channel to receive alerts when configuration delivery fails. Regular monitoring helps maintain visibility into your resource configurations and ensures compliance evaluations continue without interruption.

#### Environment-Specific Considerations

Different environments may require tailored AWS Config configurations:

- **Production environments**: Enable continuous recording for all resource types with strict compliance monitoring
- **Development/Testing environments**: Consider periodic recording for cost optimization while maintaining essential security monitoring
- **Sandbox environments**: Implement selective resource tracking based on specific use cases and compliance requirements

Align your Config settings with your organization's risk tolerance and compliance requirements for each environment type.


### Delivery Method Best Practices

When implementing AWS configuration management, establishing proper delivery methods for configuration items is crucial. A recommended best practice is to designate a centralized [Amazon S3 bucket](https://aws.amazon.com/pm/serv-s3/) within a central account, which could be either a logging account or another specifically designated account. This centralization allows for better organization and management of configuration item logs. To maintain clear organization within the bucket, it's advisable to implement a structured prefix system that clearly identifies the source account and region for each configuration item. Please also implement [security best practices for the S3 bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.htm) such as: enabling encryption in transit and at rest, disabling public access, and maintaining strict access controls. These security measures ensure compliance with data protection standards and minimize security risks. 

You can also configure AWS Config to automatically stream configuration changes and compliance status updates to a designated SNS topic. For enterprise environments with multiple AWS accounts, you establish a central SNS topic to consolidate these notifications. This centralized approach enables IT and Security teams to efficiently monitor and respond to configuration changes across the organization. To do so, [please follow this documentation](https://docs.aws.amazon.com/config/latest/developerguide/notifications-for-AWS-Config.html). 

#### API vs Console Management

When managing AWS Config at scale, prefer API-based approaches over console management for consistency and automation. API-driven management enables automated deployment through Infrastructure as Code (IaC), consistent configuration across environments, version control and change tracking, and seamless integration with CI/CD pipelines.

The organizational deployment methods described in this guide exemplify this API-first approach, using APIs like `PutOrganizationConformancePack` and `PutOrganizationConfigRule` to maintain standardized configurations across your organization. For multi-account deployments, combine delegated admin capabilities with API-driven automation to ensure governance and operational efficiency.

#### Service Quotas and Limitations

Be aware of AWS Config service quotas when planning your implementation:

- **Configuration recorders**: 1 per region per account
- **Delivery channels**: 1 per region per account  
- **Config rules**: 1000 per region per account
- **Conformance packs**: 50 per region per account
- **Organization rules**: 1000 per organization
- **Organization conformance packs**: 50 per organization

Monitor your quota usage through the [Service Quotas console](https://console.aws.amazon.com/servicequotas/) and request increases when approaching limits. Plan your rule and conformance pack deployment strategy to stay within these boundaries while meeting your compliance requirements.

#### AWS Service Integrations

AWS Config integrates with various AWS services to provide comprehensive governance and compliance capabilities. Key integrations include:

- **AWS Security Hub CSPM**: Centralizes security checks from AWS Config rules to verify resource configurations align with best practices (CIS, PCI-DSS, AWS Foundational Security Best Practices)
- **AWS Control Tower**: Automatically enables Config on all enrolled accounts to monitor compliance through detective and proactive controls
- **AWS CloudTrail**: Correlates configuration changes to specific events, providing details on who made changes, when, and from which IP address

For a complete list of service integrations, see [AWS Service Integrations with AWS Config](https://docs.aws.amazon.com/config/latest/developerguide/service-integrations.html).

Coordinate with teams managing these services to avoid duplicate rules and ensure optimal integration.

### Centralized Operations and Automation

#### Automation Best Practices

Implement automation to reduce manual overhead and ensure consistent Config management:

- **Infrastructure as Code (IaC)**: Use CloudFormation, Terraform, or CDK to deploy Config resources
- **CI/CD Integration**: Automate rule deployment and updates through pipelines
- **Configuration Drift Detection**: Monitor and automatically remediate configuration drift
- **Automated Reporting**: Generate compliance reports and dashboards automatically

#### Remediation Automation

AWS Config integrates with various automation services for remediation:

- **Systems Manager Automation**: Execute predefined runbooks for common remediation tasks
- **Lambda Functions**: Implement custom remediation logic for complex scenarios
- **EventBridge Integration**: Trigger automated responses to compliance violations
- **AWS Config Remediation**: Use built-in remediation actions for supported rules

Consider implementing automated remediation for common issues while maintaining appropriate approval workflows for critical changes. Balance automation with human oversight based on the risk level of the remediation actions.

### Visual Dashboard
[AWS Config configuration snapshot data](https://docs.aws.amazon.com/config/latest/developerguide/deliver-snapshot-cli.html) in S3 can be queried using [Amazon Athena](https://aws.amazon.com/athena/), and customers can create custom visualizations using [Amazon Quick Suite](https://aws.amazon.com/quicksuite/) or [Amazon Managed Grafana](https://aws.amazon.com/blogs/mt/exploring-aws-config-data-using-amazon-athena-and-amazon-managed-grafana/). 

We recommend establishing a single dashboard, consolidating data from all regions and resource types into a unified view. This approach provides a comprehensive overview of your organization's configuration state, simplifying monitoring and management tasks. For multi-account environments, consider creating a centralized dashboard in a dedicated analytics account. This central dashboard can pull data from multiple accounts, and multiple data sources in addition to AWS Config, offering a holistic view of the entire AWS environment's configuration and compliance status with the detail that you pull in. This centralized visibility is essential for maintaining consistent security policies and operational standards across the organization.

To learn how to aggregate AWS Config data, perform advanced queries, and create customized inventory dashboards, [follow the monitoring with AWS Config workshop](https://catalog.workshops.aws/cloudops-accelerator/en-US/inventory/monitoring-resources-with-aws-config). Also refer to AWS Config Resource Compliance section of the [AWS Cloud Intelligence Dashboards](https://docs.aws.amazon.com/guidance/latest/cloud-intelligence-dashboards/config-resource-compliance-dashboard.html) that shows you how to deploy business intelligent dashboard for your organization.