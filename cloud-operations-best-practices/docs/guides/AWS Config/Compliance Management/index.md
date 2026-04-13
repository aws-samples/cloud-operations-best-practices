---
sidebar_position: 4
---
# Compliance Management

AWS Config provides two primary types of rules for evaluating resource configurations within your AWS environment. The first type, [Managed Rules](https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html), are pre-built rules provided by AWS, covering various security, operational, and compliance use cases. Managed Rules are pre-configured rule templates that evaluate your AWS resources against best practices and common compliance standards. The second type [Custom Rules](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config_develop-rules.html), allows organizations to create their own rules enabling them to implement organization-specific compliance requirements and checks.

Custom rules can be created through AWS Lambda functions, where you code the logic that evaluates if your AWS resources are compliant or not. AWS Config also allows for the [creation of custom rules using Guard Custom policy](https://aws.amazon.com/blogs/mt/announcing-aws-config-custom-rules-using-guard-custom-policy/). [Guard Custom policy](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config_develop-rules.html) simplify the process of creating custom rules as you won’t need to create Lambda functions. Guard Custom policy lets you define your policy-as-code to evaluate your resource against the policy that’s defined using the [Guard domain-specific language (DSL)](https://docs.aws.amazon.com/cfn-guard/latest/ug/writing-rules.html).

AWS Config integrates natively with [AWS Systems Manager Automation documents](https://aws.amazon.com/blogs/mt/remediate-noncompliant-aws-config-rules-with-aws-systems-manager-automation-runbooks/) for remediation actions.  You can create your own custom remediation actions using AWS Systems Manager Automation documents and will have the option to choose manual or automatic remediation through AWS Config. 

Additionally, AWS also provides [Service-Linked Rules](https://docs.aws.amazon.com/config/latest/developerguide/service-linked-rules.html), which are automatically created and managed by other AWS services to evaluate resource configurations specific to those services. For example, AWS Security Hub can create service-linked rules in AWS Config to evaluate security best practices and standards. You can also deploy [Organization Rules](https://docs.aws.amazon.com/config/latest/developerguide/config-rule-multi-account-deployment.html), which allow you to deploy and manage rules across multiple accounts in your AWS Organizations structure, making it easier to maintain consistent compliance across your entire AWS environment.

### Rule Trigger Types

AWS Config rules use [trigger types](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config_components.html) to determine when resources are evaluated for compliance. Understanding these triggers is essential for designing effective detection rules.

#### Configuration Change-Triggered Rules
AWS Config runs evaluations when a resource matching the rule's [scope](https://docs.aws.amazon.com/config/latest/APIReference/API_Scope.html) has a configuration change. The evaluation runs after AWS Config sends a configuration item change notification. You define which resources initiate the evaluation by setting the rule's scope, which can include:
- One or more resource types
- A combination of a resource type and a resource ID
- A combination of a tag key and value
- When any recorded resource is created, updated, or deleted

Change-triggered rules provide near-real-time compliance detection and are the primary mechanism for monitoring resource configurations.

#### Periodic Rules
AWS Config runs evaluations at a frequency you choose. Valid frequencies are: 1 hour, 3 hours, 6 hours, 12 hours, or 24 hours. The default is every 24 hours if no frequency is specified. Periodic rules are suited for checks that are time-based rather than change-based, such as access key rotation age or certificate expiration.

#### Hybrid Rules
Some rules have both configuration change and periodic triggers. For these rules, AWS Config evaluates your resources when it detects a configuration change and also at the frequency you specify.

For a complete list of managed rules organized by trigger type, see [List of AWS Config Managed Rules by Trigger Type](https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-trigger-type.html).

#### Excluding Resources from Evaluation
For change-triggered rules, use the rule's scope to limit which resources trigger evaluation — by resource type, resource ID, or tag key/value pair. For custom rules (Lambda-based or Guard), you can use input parameters to implement additional exclusion logic, such as skipping resources with specific tags. Note that scope-based filtering only applies to change-triggered evaluations, not periodic.

**Recommendation**: Use change-triggered rules as the default for compliance monitoring. Reserve periodic rules for checks that require time-based evaluation (e.g., certificate expiration, key rotation). Use the rule scope to target specific resource types or tag key/value combinations to reduce unnecessary evaluations and cost.

### Conformance Packs vs Custom Rules

AWS Config regularly releases new managed rules to address emerging security, operational, and compliance requirements. Stay updated with the latest releases through the [AWS Config managed rules documentation](https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html).

When deciding between conformance packs and individual custom rules, consider the following:

**Use Conformance Packs when:**
- Implementing industry-standard compliance frameworks (HIPAA, NIST, PCI-DSS)
- Managing compliance across multiple accounts and regions
- Requiring immutable rule sets with formal change control
- Needing centralized deployment and management

**Use Individual Custom Rules when:**
- Implementing organization-specific requirements
- Prototyping new compliance checks
- Managing simple, standalone evaluations
- Requiring frequent rule modifications

Ensure conformance packs don't become "keep the lights on" (KTLO) overhead by regularly reviewing and optimizing their contents. Remove redundant or obsolete rules to maintain efficiency.

**Recommendation**: Start with AWS-provided conformance pack templates aligned to your compliance framework. Customize by adding organization-specific custom rules. Use individual custom rules for prototyping and standalone checks that don't fit a broader compliance framework. Review conformance pack contents quarterly to remove rules that are no longer relevant or are duplicated by other services like AWS Security Hub.

### Conformance Packs

Instead of deploying managed rules or custom rules individually to specific regions and accounts, a best practice is to bundle them into [Conformance Packs](https://docs.aws.amazon.com/config/latest/developerguide/conformance-packs.html).  AWS Conformance Packs provide a single point of control to deploy and monitor hundreds of rules across multiple accounts and regions, ensuring consistent security and compliance standards at scale. They offer [pre-built templates for common frameworks](https://docs.aws.amazon.com/config/latest/developerguide/conformancepack-sample-templates.html) (like HIPAA, NIST, PCI-DSS) and allow custom rule creation, significantly reducing the time and effort needed for compliance management. These packs represent immutable groups of Config rules, ensuring that changes can only be made through formal updates to the conformance pack itself. This approach provides better governance and control over your compliance rules.

**Recommendation**: Deploy conformance packs from a delegated administrator account using organizational deployment APIs (`PutOrganizationConformancePack`). Use AWS-provided sample templates as a baseline and extend with custom rules for organization-specific requirements. Avoid deploying individual rules when a conformance pack can bundle them — this simplifies management and ensures immutable change control.

#### Conformance Packs with Automated Remediation

A conformance pack detects non-compliance but it does not resolve it. To close the loop, pair conformance pack rules with [AWS Systems Manager Automation runbooks](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-automation.html) that execute remediation actions automatically when a rule evaluates as `NON_COMPLIANT`. This pattern is deployed as a single conformance pack template that bundles both the rule definition and its corresponding remediation configuration, ensuring they are versioned and deployed together.

In practice, this means the conformance pack YAML template includes `AWS::Config::RemediationConfiguration` resources alongside the rule definitions. When the pack is deployed via `PutOrganizationConformancePack`, both the detection and remediation logic propagate to every account and region in scope. This eliminates the operational gap where a rule flags a violation but no automated response exists which is a common failure mode in organizations that deploy rules and remediation separately.

There are two operational considerations at scale. First, automatic remediation executes with the permissions of the SSM Automation execution role in the target account. Scope this role narrowly — a remediation runbook that re-enables S3 default encryption should not have permissions to modify IAM policies. Second, remediation actions generate their own CloudTrail events and can trigger downstream Config evaluations, creating evaluation loops if the remediation itself changes a tracked resource attribute. Test remediation actions in a sandbox account before enabling auto-remediation in production conformance packs. For a step-by-step implementation, refer to [Manage Custom AWS Config Rules with Remediation Using Conformance Packs](https://aws.amazon.com/blogs/mt/manage-custom-aws-config-rules-with-remediation-using-conformance-packs/).

**Recommendation**: Bundle remediation configurations inside the conformance pack template rather than attaching them after deployment. This ensures detection and remediation are deployed atomically and cannot drift independently. Start with auto-remediation for deterministic, low-risk actions (e.g., enabling encryption, adding required tags) and use manual approval workflows for actions that modify network or identity configurations.


### AWS Config Rules Development Kit (RDK) 

The AWS Config [Rules Development Kit](https://github.com/awslabs/aws-config-rdk) (RDK), available in the AWS samples GitHub repository, streamlines the creation of custom Config rules. It provides boilerplate code templates that require minimal modification for implementing resource evaluations. The RDK supports various deployment scenarios, including the centralized Lambda function approach mentioned above.

The RDK offers several advantages:
- **Rapid Development**: Pre-built templates accelerate rule creation
- **Testing Framework**: Built-in testing capabilities for rule validation
- **Deployment Automation**: Simplified deployment across multiple accounts and regions
- **Version Management**: Integration with source control systems

Please refer to this blog to [build and operate custom AWS Config rules at scale](https://aws.amazon.com/blogs/mt/aws-config-rule-development-kit-library-build-and-operate-rules-at-scale/) using AWS Config RDK.

**Recommendation**: Use the RDK when you need Lambda-based custom rules that require complex evaluation logic, such as cross-resource checks or API calls to other AWS services. For simpler policy checks that evaluate a single resource's configuration properties, prefer AWS CloudFormation Guard custom rules to reduce cost and complexity.

### AWS CloudFormation Guard

[AWS CloudFormation Guard](https://docs.aws.amazon.com/cfn-guard/latest/ug/what-is-guard.html) provides an alternative to Lambda-based custom rules, offering policy-as-code evaluation capabilities. Guard is preferred over Lambda functions for custom rule implementation as it:

- **Reduces costs**: No Lambda execution charges
- **Simplifies development**: Uses declarative policy language instead of code
- **Improves performance**: Faster evaluation compared to Lambda cold starts
- **Enhances maintainability**: Easier to read and modify policies

Guard uses a domain-specific language (DSL) to define policies that evaluate resource configurations. This approach is particularly effective for:
- Infrastructure compliance checks
- Security policy validation
- Cost optimization rules
- Operational best practice enforcement

**Recommendation**: Default to Guard for new custom rules unless your evaluation logic requires API calls to other AWS services or complex computation that Guard's DSL cannot express. Guard rules have no Lambda execution charges, no cold start latency, and are easier to read and maintain than Lambda function code.

### Custom Evaluation

When implementing custom evaluations, consider these best practices:

#### Scope Optimization
- Use resource-specific triggers rather than evaluating all resources
- Implement resource tagging for better control and targeting
- Narrow the scope of evaluated resources using specific targeting (note: scope-based rules are only supported for event-based evaluations, not periodic)

The PutEvaluations API accepts a maximum of 100 evaluations per call. If your rule evaluates thousands of resources, you must batch the results. In high-volume environments (e.g., an account with 10,000+ EC2 instances), this batching combined with API throttling can cause your Lambda to approach the 15-minute timeout.

#### Resource Lifecycle Management
- Add logic to handle the termination of evaluation for deleted resources
- Implement proper error handling for resources in transitional states
- Consider resource dependencies when designing evaluation logic

If your Lambda function calls AWS APIs (e.g., describing resources in other accounts), transient throttling or network failures will cause the evaluation to fail silently. Implement exponential backoff and retry logic in your function code.

#### Performance Optimization
- Minimize API calls within custom rule logic
- Cache frequently accessed data when possible
- Use batch operations where supported by AWS APIs

Lambda functions have a 15-minute maximum execution time. If your rule evaluates resources that require multiple API calls (e.g., checking security group rules across VPC peering connections, or validating cross-account resource policies), you may hit this limit. In environments with hundreds of rules triggering simultaneously (e.g., after a large CloudFormation deployment), cold starts compound and create evaluation backlogs. Batch your evaluations or narrow the scope to specific resource types.

**Recommendation**: Always scope custom Lambda rules to specific resource types to avoid unnecessary Lambda invocations — an unscoped rule will invoke the Lambda function for every resource in the account. For Lambda-based rules, return `NOT_APPLICABLE` for deleted resources to prevent stale evaluation results from accumulating and causing cost spikes when the rule is eventually deleted. For rules that don't require API calls to other services, prefer Guard over Lambda.

### Global Resource Management

For rules evaluating global resources (such as AWS IAM rules), deploy them in only one region to avoid duplicate costs and redundant API calls. This practice optimizes both cost efficiency and resource utilization while maintaining effective compliance monitoring.

**Recommendation**: Designate a single region (typically your home region or us-east-1) for all rules that evaluate global resources like AWS IAM. Disable global resource rule evaluation in all other regions. For periodic rules that report compliance on global IAM resource types, deploy them only in [supported regions](https://docs.aws.amazon.com/config/latest/developerguide/select-resources.html#select-resources-all) to avoid unnecessary evaluations.


### Evaluation Management

When managing rule evaluations, be mindful of the options to delete evaluation results or trigger re-evaluations. Frequent use of these features will generate new [configuration items](https://docs.aws.amazon.com/config/latest/APIReference/API_ConfigurationItem.html) for resources, potentially impacting storage and processing requirements.

Also note that the maximum rules per region per account is 1,000 and this is hard limit today. Rules inside conformance packs count toward this limit. In environments with multiple conformance packs (e.g., HIPAA + PCI-DSS + custom), you can approach this limit quickly due to overlapping rules.

#### Rule Deletion Best Practices
When deleting rules that evaluate large numbers of resources, follow this cost-effective approach:
1. Stop [resource compliance recording](https://docs.aws.amazon.com/config/latest/developerguide/stop-start-recorder.html)
2. Delete the rules
3. Restart compliance recording

This sequential process helps prevent unnecessary spikes in configuration item generation and associated costs. Note that this will not impact your stored data but will temporarily affect visibility into resource configuration while the recorder is stopped.

**Recommendation**: Before deleting rules that evaluate a large number of resources, consider excluding the `AWS::Config::ResourceCompliance` resource type from recording, delete the rules, then re-enable recording. Deleting rules is an asynchronous process that can take an hour or more — during this time, rule evaluations will not be recorded in the resource's compliance history. Weigh the cost savings against the temporary gap in compliance visibility on a case-by-case basis.

#### Re-evaluation Strategies
- Schedule re-evaluations during off-peak hours to minimize impact
- Use targeted re-evaluations for specific resources rather than organization-wide evaluations
- Monitor Amazon CloudWatch metrics to track evaluation performance and costs
- Implement automated remediation to reduce the need for manual re-evaluations

AWS Config offers five fixed intervals: 1 hour, 3 hours, 6 hours, 12 hours, or 24 hours. There is no sub-hourly option and no custom interval. If your compliance requirement demands near-real-time evaluation, use event-based (configuration change) triggers instead. When a resource undergoes rapid successive changes (e.g., an Auto Scaling group scaling from 2 to 50 instances in minutes), AWS Config may consolidate changes and only evaluate the final state. This means intermediate non-compliant states can go undetected. This is particularly relevant for ephemeral workloads like containers, spot instances, and CI/CD pipelines.

#### Remediation Integration
AWS Config integrates natively with [AWS Systems Manager Automation documents](https://aws.amazon.com/blogs/mt/remediate-noncompliant-aws-config-rules-with-aws-systems-manager-automation-runbooks/) for remediation actions. You can create custom remediation actions and choose between manual or automatic remediation through AWS Config. Consider implementing automated remediation for:
- Common security misconfigurations
- Cost optimization opportunities
- Operational best practice violations
- Compliance drift corrections

**Recommendation**: Implement automatic remediation for low-risk, high-frequency violations (e.g., missing tags, disabled encryption). Use manual remediation with approval workflows for high-risk changes (e.g., security group modifications, AWS IAM policy changes). Leverage [AWS Systems Manager Automation runbooks](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-automation.html) for standardized remediation actions, and test all remediation actions in a non-production environment before enabling auto-remediation.