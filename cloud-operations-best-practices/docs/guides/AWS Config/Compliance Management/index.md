---
sidebar_position: 4
---
# Compliance Management

AWS Config provides two primary types of rules for evaluating resource configurations within your AWS environment. The first type, [Managed Rules](https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html), are pre-built rules provided by AWS, covering various security, operational, and compliance use cases. Managed Rules are pre-configured rule templates that evaluate your AWS resources against best practices and common compliance standards. The second type [Custom Rules](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config_develop-rules.html), allows organizations to create their own rules enabling them to implement organization-specific compliance requirements and checks.

Custom rules can be created through AWS Lambda functions, where you code the logic that evaluates if your AWS resources are compliant or not. AWS Config also allows for the [creation of custom rules using Guard Custom policy](https://aws.amazon.com/blogs/mt/announcing-aws-config-custom-rules-using-guard-custom-policy/). [Guard Custom policy](https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config_develop-rules.html) simplify the process of creating custom rules as you won’t need to create Lambda functions. Guard Custom policys lets you define your policy-as-code to evaluate your resource against the policy that’s defined using the [Guard domain-specific language (DSL)](https://docs.aws.amazon.com/cfn-guard/latest/ug/writing-rules.html).

AWS Config integrates natively with [Systems Manager Automation documents](https://aws.amazon.com/blogs/mt/remediate-noncompliant-aws-config-rules-with-aws-systems-manager-automation-runbooks/) for remediation actions.  You can create your own custom remediation actions using AWS Systems Manager Automation documents and will have the option to choose manual or automatic remediation through AWS Config. 

Additionally, AWS also provides [Service-Linked Rules](https://docs.aws.amazon.com/config/latest/developerguide/service-linked-rules.html), which are automatically created and managed by other AWS services to evaluate resource configurations specific to those services. For example, AWS Security Hub can create service-linked rules in AWS Config to evaluate security best practices and standards. You can also deploy [Organization Rules](https://docs.aws.amazon.com/config/latest/developerguide/config-rule-multi-account-deployment.html), which allow you to deploy and manage rules across multiple accounts in your AWS Organizations structure, making it easier to maintain consistent compliance across your entire AWS environment.

### Proactive vs Detective Evaluation

AWS Config rules can operate in two evaluation modes:

#### Detective Evaluation (Traditional)
- Evaluates resources **after** they are created or modified
- Identifies non-compliant resources and provides alerts
- Requires remediation actions to fix non-compliant resources
- Suitable for monitoring and auditing existing infrastructure

#### Proactive Evaluation (Preventive)
- Evaluates resources **before** they are created or modified
- Prevents non-compliant resources from being deployed
- Integrates with [AWS CloudFormation Hooks](https://docs.aws.amazon.com/cloudformation-cli/latest/hooks-userguide/hooks-concepts.html) for Infrastructure as Code validation
- Reduces operational overhead by preventing issues rather than detecting them

**Best Practice**: Use proactive evaluation for critical security and compliance requirements to prevent non-compliant resources from being created. Combine with detective evaluation for comprehensive coverage, as proactive rules only apply to CloudFormation-deployed resources. Many organizations underutilize this capability despite its maturity.

# ^^ There's only one managed proactive. Add how/when to get proactive in

For detailed guidance on implementing proactive compliance, see the blog post on [How to use AWS Config proactive rules and AWS CloudFormation Hooks](https://aws.amazon.com/blogs/mt/how-to-use-aws-config-proactive-rules-and-aws-cloudformation-hooks-to-prevent-creation-of-non-complaint-cloud-resources/). 

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

### Conformance Packs

Instead of deploying managed rules or custom rules individually to specific regions and accounts, a best practice is to bundle them into [Conformance Packs](https://docs.aws.amazon.com/config/latest/developerguide/conformance-packs.html).  AWS Conformance Packs provide a single point of control to deploy and monitor hundreds of rules across multiple accounts and regions, ensuring consistent security and compliance standards at scale. They offer [pre-built templates for common frameworks](https://docs.aws.amazon.com/config/latest/developerguide/conformancepack-sample-templates.html) (like HIPAA, NIST, PCI-DSS) and allow custom rule creation, significantly reducing the time and effort needed for compliance management. These packs represent immutable groups of Config rules, ensuring that changes can only be made through formal updates to the conformance pack itself. This approach provides better governance and control over your compliance rules.


### AWS Config Rules Development Kit (RDK) 

The AWS Config [Rules Development Kit](https://github.com/awslabs/aws-config-rdk) (RDK), available in the AWS samples GitHub repository, streamlines the creation of custom Config rules. It provides boilerplate code templates that require minimal modification for implementing resource evaluations. The RDK supports various deployment scenarios, including the centralized Lambda function approach mentioned above.

The RDK offers several advantages:
- **Rapid Development**: Pre-built templates accelerate rule creation
- **Testing Framework**: Built-in testing capabilities for rule validation
- **Deployment Automation**: Simplified deployment across multiple accounts and regions
- **Version Management**: Integration with source control systems

Please refer to this blog to [build and operate custom AWS Config rules at scale](https://aws.amazon.com/blogs/mt/aws-config-rule-development-kit-library-build-and-operate-rules-at-scale/) using AWS Config RDK.

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

### Custom Evaluation

When implementing custom evaluations, consider these best practices:

#### Scope Optimization
- Use resource-specific triggers rather than evaluating all resources
- Implement resource tagging for better control and targeting
- Narrow the scope of evaluated resources using specific targeting (note: scope-based rules are only supported for event-based evaluations, not periodic)

#### Resource Lifecycle Management
- Add logic to handle the termination of evaluation for deleted resources
- Implement proper error handling for resources in transitional states
- Consider resource dependencies when designing evaluation logic

#### Performance Optimization
- Minimize API calls within custom rule logic
- Cache frequently accessed data when possible
- Use batch operations where supported by AWS APIs

### Global Resource Management

For rules evaluating global resources (such as IAM rules), deploy them in only one region to avoid duplicate costs and redundant API calls. This practice optimizes both cost efficiency and resource utilization while maintaining effective compliance monitoring.


### Evaluation Management

When managing rule evaluations, be mindful of the options to delete evaluation results or trigger re-evaluations. Frequent use of these features will generate new [configuration items](https://docs.aws.amazon.com/config/latest/APIReference/API_ConfigurationItem.html) for resources, potentially impacting storage and processing requirements.

#### Rule Deletion Best Practices
When deleting rules that evaluate large numbers of resources, follow this cost-effective approach:
1. Stop [resource compliance recording](https://docs.aws.amazon.com/config/latest/developerguide/stop-start-recorder.html)
2. Delete the rules
3. Restart compliance recording

This sequential process helps prevent unnecessary spikes in configuration item generation and associated costs. Note that this will not impact your stored data but will temporarily affect visibility into resource configuration while the recorder is stopped.

#### Re-evaluation Strategies
- Schedule re-evaluations during off-peak hours to minimize impact
- Use targeted re-evaluations for specific resources rather than organization-wide evaluations
- Monitor CloudWatch metrics to track evaluation performance and costs
- Implement automated remediation to reduce the need for manual re-evaluations

#### Remediation Integration
AWS Config integrates natively with [Systems Manager Automation documents](https://aws.amazon.com/blogs/mt/remediate-noncompliant-aws-config-rules-with-aws-systems-manager-automation-runbooks/) for remediation actions. You can create custom remediation actions and choose between manual or automatic remediation through AWS Config. Consider implementing automated remediation for:
- Common security misconfigurations
- Cost optimization opportunities
- Operational best practice violations
- Compliance drift corrections