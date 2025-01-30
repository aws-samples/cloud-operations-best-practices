---
sidebar_position: 5
---
# Patch Management

 [Patch Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-patch.html), a capability of Systems Manager, to automate the process of patching managed nodes with security related updates. You can patch Amazon EC2 instances, edge devices, and on-premises servers and virtual machines (VMs), including VMs in other cloud environments. 

![AWS Systems Manager Patch Management](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-1.png "AWS Systems Manager Patch Management")

Common challenges organizations face when it comes to patch management is dependent on having a current and complete inventory of the patchable software, including applications and operating systems that’s installed on each host within the company’s environment. Secondly, enterprise patch management can cause some resources to be overloaded in terms of both people and infrastructure. Next, installing patches can cause side effects to occur. Another common challenge, which often cause organizations to error on the side of caution is unintended or unexpected problems that are cause by patches. Now it can be surprisingly difficult to examine a host and determine whether or not a particular patch has actually taken effect. This challenge could be faced on a single system, or if you extrapolate that out across an entire organization fleet or servers and operating systems, the scale of that challenge can quickly become very overwhelming.

By prioritizing specific patches through classification of what functions are most critical your business and then at which patches make the most difference to those functions. Email, customer facing digital properties etc. From there you can create patch baselines, collections . Scanning  helps you determine the level of compliance against the baselines that you’ve established.

![AWS Systems Manager Patch Management](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-2.png "AWS Systems Manager Patch Management")

![AWS Systems Manager Patch Management](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-3.png "AWS Systems Manager Patch Management")

**What occurs within the OS during patching?** 

A common question from customers is how does Patch Manager interacts with Linux and Windows repos. On Microsoft Windows operating systems, Patch Manager retrieves a list of available updates that Microsoft publishes to Microsoft Update and are automatically available to Windows Server Update Services (WSUS). Patch Manager continually monitors for new updates in every AWS Region. The list of available updates is refreshed in each Region at least once per day. When the patch information from Microsoft is processed, Patch Manager removes updates that were replaced by later updates from its patch list . Therefore, only the most recent update is displayed and made available for installation. 

![Patch Management OS Patching](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-4.png "Patch Management OS Patching")

**Defining patch criteria**

Patch Manager provides [predefined patch baselines](https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-patch-baselines.html) for each of the operating systems supported by Patch Manager. You can use these baselines as they are currently configured (you can't customize them) or you can create your own custom patch baselines. Custom patch baselines allows you greater control over which patches are approved or rejected for your environment. In this section, we will create our own custom patch baseline, choose which patches to auto-approve, and specify the custom patch baselines as the default for their respective operating systems.

Within a baseline you can: 

*   Define what patches are approved
*   Use auto-approval delays for cutoffs
*   Define patch exceptions
*   Define custom patch repositories for Linux
*   Define patch criteria for multiple operating systems


**Different types of patching** 

There are two approaches that you can take with your patching solution from a centralized or decentralized. 

![Patch Management Patching](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-5.png "Patch Management Patching")

**Example centralized patching solutions for multi-account organizations**

Option 1: A Centralized patching solution would be using Patch Policies to easily set up [patch management across an AWS Organization](https://docs.aws.amazon.com/systems-manager/latest/userguide/quick-setup-patch-manager.html). Patch policies enable customers to scan and schedule patch installation for multiple patch baselines across AWS accounts and across AWS Regions.  

![Patch Management Patching Option 1](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-6.png "Patch Management Patching Option 1")

Option 2: Another option for a decentralized solution is  schedule a multi-account and multi-Region patching operation using [Amazon EventBridge](https://aws.amazon.com/eventbridge/), [AWS Lambda](https://aws.amazon.com/lambda/), and AWS Systems Manager Automation. 

![Patch Management Patching Option 2](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-7.png "Patch Management Patching Option 2")

**Example self-service patching solution for multi-account organizations**

Different application owners have different requirements in terms of patch operations, patch timing, frequency of patching, and flexibility of testing patches in lower environments (DEV or UAT). Using Service Catalog, central teams can create products which act as the building blocks for self-service patching. Application/account owners can then deploy these products into their environment and only have to provide a few parameters, such as the schedule, without having to build a solution themselvesSyncs

![Patch Management Patching Solution](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-8.png "Patch Management Patching Solution")

**Patch in place vs Rehydration**
Rehydration (repaving, refreshing) is the process of spinning up new servers with latest patches installed and decommissioning old nodes. A common practice for EC2 instances in an Auto Scaling Group, managed node groups in a container cluster (ECS / EKS), and AMIs that are preconfigured with application workload requirements.

![Patch Management Patch in Place vs Rehydration](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-9.png "Patch Management Patch in Place vs Rehydration")

**Cross org patching - patch policies** 

To created a standardization of patching requirements is using Patch policies with Quick Setup. You can apply a patch policy across an entire organization for multiple operating systems, across multiple accounts and Regions, and review resource compliance for the target managed nodes.

Using Quick Setup across multiple accounts helps to ensure that your organization maintains consistent configurations. Additionally, Quick Setup periodically checks for configuration drift and attempts to remediate it. Configuration drift occurs whenever a user makes any change to a service or feature that conflicts with the selections made through Quick Setup.

![Patch Management Cross Org Patching](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-10.png "Patch Management Cross Org Patching")

1. You create the patch policy using Quick Setup and the parameters selected are sent to CloudFormation.
1. CloudFormation creates a stack set with the defined parameters and defined target accounts and Regions. This is generated by Quick Setup during deployment. 
1. CloudFormation creates stack instances in each target account and Region.
1. The stack instances create a Systems Manager [State Manager association](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-state.html) for the defined patch scan and an association for patch installation, if selected. These associations are applied using the schedules provided when you create the patch policy.
1. Amazon Simple Storage Service (S3) bucket to store the patch baselines specified as a JSON file.
1. AWS Lambda function to evaluate custom patch baselines specified within Quick Setup for changes. If changes are made to the custom patch baselines, Quick Setup propagates those changes across the target accounts and Regions.
1. Systems Manager [Automation runbook](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-automation.html) to invoke the Lambda function.
1. Systems Manager [State Manager association](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-state.html) to initiate the Automation runbook every hour.
1. AWS Identity and Access Management (IAM) roles for Lambda and Automation.

In the target accounts and Regions, the following resources are created:

*   Automation runbook and State Manager association to create and attach the Quick Setup IAM role to EC2 and hybrid managed nodes
*   State Manager association to enable [Systems Manager Explorer](https://docs.aws.amazon.com/systems-manager/latest/userguide/Explorer.html)
*   State Manager association to remediate Quick Setup related tags on managed nodes

**Note:** Currently, Patch Policies through Quick Setup uses the management account within your AWS Organization to deploy the baselines to the account. To deploy Patch Policies outside of the management account, visit [How to deploy Patch Policies outside of Quick Setup](https://catalog.us-east-1.prod.workshops.aws/workshops/7c0ea253-6462-41cd-af76-3850c92458fa/en-US). 

**On-demand patching:**

There are times where you might need to patch nodes outside of the patching cycles based on testing results from needing to exclude specific packages or needing to patch from new releases. 

**Option 1:** Patch now (*single AWS account-AWS Region pair at a time. It can't be used with patching operations that are based on patch policies.)*

* You can create a different baseline that will perform a patch scan or install applicable patches based on approval rules that differs from your current baseline. Patch now is especially useful when you must apply zero-day updates or install other critical patches on your managed nodes as soon as possible.

**Option 2:** Automation *(multi-account/ Region capability)*

* To perform an on-demand patching operation utilize automation when you are targeting a multiple accounts or Regions.  You can leverage IAM roles deployed into target accounts. You can integrate with Patch Policies or stand alone patching requirements. 


**Reviewing compliance reporting** 
Patch Manager dashboard provides a snapshot of patch compliance within the current AWS account and Region. 
Compliance reporting allows you to determine patch compliance for nodes. Fleet Manager and inventory gives you more details on what patches were installed and what was the severity and criticality of those patches. 

While this is specific to the account and Region, you are able to create a solution around reporting compliance for the entire Organization. 

**Creating end-to-end patch management and inventory reporting in an AWS Organization**

To created report on patch compliance across your AWS Organization, you can use Systems Manager resource data sync to send inventory data collected from all of your managed nodes to a single Amazon S3 bucket. Resource data sync then automatically updates the centralized data when new inventory data is collected.

Using  [AWS Glue crawler](https://docs.aws.amazon.com/glue/latest/dg/add-crawler.html) to automatically create databases and tables from the patch compliance data in S3 to then later query patch compliance data with [Amazon Athena .](https://aws.amazon.com/athena/) While this solution uses [Amazon QuickSight](https://aws.amazon.com/quicksight/)to visualize the patch compliance data, you can use any BI tool that can pull the data from the S3 bucket. 


Note: You will need to create a resource data sync in every account and Region that you want to collect inventory data from your nodes. 

![End-to-End Patch Management](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-11.png "End-to-End Patch Management")

1. Create Systems Manager Resource Data Syncs in each account/Region
1. Centrally aggregate patch compliance data in a single Amazon S3 Bucket
1. Automatically create database and tables using an AWS Glue Crawler
1. Query patch or inventory data using Amazon Athena
1. Visualize patch compliance using Amazon QuickSight


Resource Data Syncs pushes data to S3 buckets based on actions taken from on-demand actions (Registering or terminating instances /performing a patch scan or install), scheduled actions (Gathering software inventory, gathering custom inventory metadata, performing a patch install, and evaluating compliance using Chef InSpec).

![End-to-End Patch Management](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-12.png "End-to-End Patch Management")

**Automating vulnerability management**

Amazon Inspector provides continuous vulnerability scanning and EC2 scanning is built on top of SSM agent. While 
Inspector reports vulnerabilities of the OS and network (VPC) findings include vulnerable package version, fixed version (if possible) but it does not provide a method to remediate. 

![Automating Vulnerability Management](/img/guides/centralized-operations-management/patch-management/BP-Patch-Mgmt-13.png "Automating Vulnerability Management")

