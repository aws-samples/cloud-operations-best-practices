---
sidebar_position: 1
---

# Just-in-time node access (JITNA) samples

This section contains a collection of samples for creating resources when using Systems Manager just-in-time node access (JITNA).

The samples are designed to educate AWS customers on how to implement just-in-time node access.

Please keep in mind that this is sample code and should be thoroughly tested and validated in a development environment prior to any usage in a production environment.

## Enable just-in-time node access via CloudFormation

The following section describes how to deploy just-in-time node access using CloudFormation.

Example architecture diagram for deploying Quick Setup configuration managers for the unified console and just-in-time node access

### Pre-requisites

Before deploying the two required Quick Setup configuration managers, you must first delegate

### Deploy Quick Setup configuration managers

To enable just-in-time node access using infrastructure-as-code (IaC), you need to:

1. (Optionally) Deploy Quick Setup IAM service roles
    :::info
    For more information on IAM service roles for Quick Setup, see [Manual onboarding for working with Quick Setup API programatically](https://docs.aws.amazon.com/systems-manager/latest/userguide/quick-setup-getting-started.html#quick-setup-api-manual-onboarding).
    :::
1. Deploy two [Quick Setup Configuration Managers](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ssmquicksetup-configurationmanager.html):
    1. Systems Manager unified console
    1. Systems Manager just-in-time-node access

The following example CloudFormation template includes creating the two required Quick Setup IAM service roles and deploys the two Quick Setup configuration managers for the Systems Manager unified console and JITNA.

[Just-in-time node access sample CFN template](/cloud-operations-best-practices/static/cfn-templates/just-in-time-node-access/just-in-time-quick-setup-cfn-template.yaml)
