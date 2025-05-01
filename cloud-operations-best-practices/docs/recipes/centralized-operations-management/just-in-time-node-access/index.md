---
sidebar_position: 1
---

# Enable just-in-time node access via CloudFormation

The following section describes how to deploy just-in-time node access using CloudFormation in an AWS Organization. To deploy just-in-time node access, you must first enable just-in-time node access for your environment and then you can deploy just-in-time node access resources which include approval policies, session preferences, and notification configurations.

## Enable just-in-time node access

1. In the AWS management account for your organization, specify a delegated administrator account for Systems Manager.
1. Deploy the [Systems Manager unified console](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-setting-up-organizations.html).
1. Deploy [Just-in-time node access](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-just-in-time-node-access.html).

Below is an example architecture diagram for deploying Quick Setup configuration managers for the unified console and just-in-time node access.

![Example architecture diagram for deploying Quick Setup configuration managers for the unified console and just-in-time node access](/img/recipes/centralized-operations-management/just-in-time-node-access/jitna-organization.png "Just-in-time node access architecture diagram")

1. Create a CloudFormation stack within the delegated administrator account for Systems Manager.
1. The CloudFormation stack creates Quick Setup configuration managers.
1. The Quick Setup configuration manager for the unified console is deployed to all OUs in the organization, A, B, and C.
1. The Quick Setup configuration manager for JITNA is deployed into OUs A and B.

:::info
Just-in-time node access can either be enabled across your AWS Organization or for specific Organizational Units (OUs) within the organization. Deployable Regions for just-in-time node access include all Regions you have enabled for the Systems Manager unified console. You cannot enable JITNA for Regions where the unified console is not enabled.
:::

### Deploy Quick Setup configuration managers

To enable just-in-time node access using infrastructure-as-code (IaC), you need to:

1. Deploy Quick Setup IAM service roles.
    :::info
    For more information on IAM service roles for Quick Setup, see [Manual onboarding for working with Quick Setup API programatically](https://docs.aws.amazon.com/systems-manager/latest/userguide/quick-setup-getting-started.html#quick-setup-api-manual-onboarding).
    :::
1. Deploy two [Quick Setup Configuration Managers](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ssmquicksetup-configurationmanager.html):
    1. Systems Manager unified console.
    1. Systems Manager just-in-time-node access.

The following example CloudFormation template includes creating the two required Quick Setup IAM service roles and deploys the two Quick Setup configuration managers for the Systems Manager unified console and JITNA.

[Just-in-time node access sample CFN template](/cloud-operations-best-practices/static/cfn-templates/just-in-time-node-access/just-in-time-quick-setup-cfn-template.yaml)

## Configure just-in-time node access

After you have enabled just-in-time node access for your environment, you can then begin deploying approval policies, session preferences, and notification configurations.

* [Approval policies for your nodes](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-just-in-time-node-access-approval-policies.html).
* [Session preferences](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-just-in-time-node-access-session-preferences.html) for just-in-time sessions.
* [Notification configurations](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-just-in-time-node-access-notifications.html) for just-in-time access requests.

### Deploy approval policies for your nodes

Below is an example architecture diagram for deploying just-in-time node access approval policies and session preferences.

![Example architecture diagram for deploying just-in-time node access approval policies and session preferences](/img/recipes/centralized-operations-management/just-in-time-node-access/jitna-resources.png "Just-in-time node access approval policies and preferences architecture diagram")

1. Create a CloudFormation StackSet to deploy an auto-approval policy, manual approval policy (or policies), and session preferences as Systems Manager documents.
1. In each target account and Region, CloudFormation stacks deploy the required resources.
1. Create a CloudFormation Stack in the delegated administrator account for Systems Manager to deploy the deny-only access policy.

The following example CloudFormation template creates:

1. An auto-approval policy to allow automatic access to development managed nodes identified by the resource tag key-value pair `ENV:DEV`.
1. Two manual approval policies:
    1. One manual approval policy for the E-commerce application which applies to managed nodes with the resource tag key-value pair `Workload:Ecommerce`.
    1. One manual approval policy for the Finance application which applies to managed nodes with the resource tag key-value pair `Workload:Finance`.
1. A session preferences document to be used during just-in-time node access sessions.

[Just-in-time node access sample CFN template](/cloud-operations-best-practices/static/cfn-templates/just-in-time-node-access/just-in-time-quick-setup-cfn-template.yaml)
