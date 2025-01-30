---
sidebar_position: 4
---

# Node Management

Whether customers choose to operate on AWS, on-premises, or in multicloud environments and across accounts and Regions, AWS Systems Manager provides a centralized place to easily manage, diagnose, and remediate the SSM Agent, delivering comprehensive infrastructure visibility. While increasing operational efficiency and productivity regardless of where their nodes reside. 

**Prerequisites** 

There are prerequisites to leveraging AWS Systems Manager. First, the the SSM agent must be installed. Second, the [SSM agent](https://docs.aws.amazon.com/systems-manager/latest/userguide/ssm-agent.html) needs the necessary permissions to perform actions on the node on your behalf. You can do this by either using [Quick Setup](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-quick-setup.html) through [host management](https://docs.aws.amazon.com/systems-manager/latest/userguide/quick-setup-host-management.html) or use [Default Host Management (DHMC)](https://docs.aws.amazon.com/systems-manager/latest/userguide/quick-setup-default-host-management-configuration.html) or add the necessary IAM role and permissions through IaC when you deploy your resources. And lastly, the SSM agent must have network connectivity to service endpoints over the internet or by using [VPC endpoints.](https://docs.aws.amazon.com/systems-manager/latest/userguide/setup-create-vpc.html)

![AWS Systems Manager Agent](/img/guides/centralized-operations-management/node-management/BP-Node-Mgmt-1.png "AWS Systems Manager Agent")

SSM Agent makes it possible for Systems Manager to update, manage, and configure these resources. The agent processes requests from the Systems Manager service in the AWS Cloud, and then runs them as specified in the request. SSM Agent then sends status and execution information back to the Systems Manager service.

**Managing IAM permissions for nodes at scale**

There are a couple of ways to manage IAM permissions for nodes. If you have a Infrastructure as Code (IaC) strategy for deploying resources then you should include the IAM role when launching the nodes. 

If you don’t have a IaC strategy or going through the IaC route is not an option then you can utilize AWS Systems Manager Quick Setup (Host Management or Default Host Management Configuration (DHMC)). 

AWS Systems Manager Quick Setup simplifies setting up AWS services, including Systems Manager, by automating common or recommended tasks in your AWS Organization across AWS accounts and Regions. These tasks include, creating required AWS Identity and Access Management (IAM) instance profile roles and setting up operational best practices, such as periodic patch scans and inventory collection.


**Enhance visibility across your entire infrastructure environment**

AWS Systems Manager helps you scale operational efficiency by simplifying node management, making it easier to manage nodes. You can now see all managed and unmanaged nodes across your organizations' AWS accounts and Regions from a single place. You can also identify, diagnose, and remediate unmanaged nodes. 

Once remediated, meaning they are managed by Systems Manager, you can leverage the full suite of Systems Manager tools to effectively execute critical operational tasks, such as applying security patches, initiating and logging sessions, or running operational commands, and gain comprehensive visibility across your entire fleet. 

**Creating an AWS Organizations delegated administrator for Systems Manager**

You can configure a delegated administrator account for Quick Setup to help you deploy and manage configurations across accounts and Regions using AWS Organizations. A delegated administrator for Quick Setup can create, update, view, and delete configuration manager resources in your organization. Systems Manager registers a delegated administrator for Quick Setup as part of the setup process for the integrated console experience. Giving you a comprehensive, centralized view to see all managed and unmanaged nodes across your organizations’ AWS accounts and Regions from a single place.
