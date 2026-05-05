<!-- Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. -->
<!-- SPDX-License-Identifier: MIT-0 -->

# CloudTrail Security Monitoring

Real-time detection and automated response for AWS CloudTrail configuration changes using Amazon EventBridge, AWS Lambda, Amazon CloudWatch, and Amazon SNS.

## Overview

This solution deploys a layered detection and response stack that alerts your security team within seconds when a CloudTrail trail is stopped, deleted, or modified — and optionally re-enables logging automatically without human intervention.

It works alongside AWS Config managed rules as complementary layers in a defense-in-depth strategy:

- **AWS Config** provides continuous compliance evaluation and configuration history
- **This solution** provides near real-time event-driven alerting and automated response

## Shared Responsibility Model

| Responsibility | AWS | Customer |
|---|---|---|
| Infrastructure security | ✅ | |
| Managed service availability and infrastructure security (EventBridge event bus isolation, Amazon SNS message encryption in transit between AWS services, Lambda runtime patching) | ✅ | |
| IAM access control to monitoring resources | | ✅ |
| AWS Key Management Service (AWS KMS) key management and rotation | | ✅ |
| CloudWatch Logs encryption using customer-managed KMS keys | | ✅ |
| S3 bucket security (Block Public Access, encryption, versioning, logging) | | ✅ |
| Amazon SNS subscription management | | ✅ |
| Lambda DLQ monitoring | | ✅ |
| Incident response on alerts | | ✅ |
| Multi-region deployment | | ✅ |
| Preventive controls (SCP, permission boundaries) | | ✅ |

## Architecture

Two parallel detection paths both route to the same SNS topic:

| Layer | Mechanism | Latency |
|---|---|---|
| EventBridge rules | Direct API event matching | ~30 seconds |
| CloudWatch metric filters + alarms | Log-based detection | 1–5 minutes |

```mermaid
flowchart TD
    CT[AWS CloudTrail] -->|Management events| CWL[CloudWatch Logs]
    CT -->|Management events| EB[Amazon EventBridge]
    S3[S3 Log Bucket] -->|Bucket events| EB

    CWL -->|Metric filters| MF[Metric Filters\nStopLogging / DeleteTrail / UpdateTrail]
    MF -->|Threshold breach| CWA[CloudWatch Alarms]
    CWA -->|Alarm action| SNS[Amazon SNS Topic\nAWS KMS-encrypted]

    EB -->|Trail tampering rule| SNS
    EB -->|S3 protection rule| SNS
    EB -->|StopLogging event| LF[Lambda Auto-Remediation\noptional]

    LF -->|StartLogging| CT
    LF -->|Failed invocations| DLQ[Amazon Simple Queue Service (Amazon SQS) Dead Letter Queue]

    SNS -->|Email subscription| SEC[Security Team]
```

**Resources deployed:**
- Amazon Simple Notification Service (Amazon SNS) topic with account-scoped topic policy (includes enumeration deny)
- **AWS Key Management Service (AWS KMS) key for Amazon SNS topic encryption** (with automatic key rotation)
- 3 CloudWatch metric filters + alarms (StopLogging, DeleteTrail, UpdateTrail)
- EventBridge rule for trail tampering events
- EventBridge rule for S3 log bucket protection (DeleteBucket, DeleteBucketPolicy, PutBucketAcl)
- IAM Managed Policy to protect monitoring resources from deletion
- Optional Lambda auto-remediation function (re-enables stopped trails)
- Optional Amazon Simple Queue Service (Amazon SQS) Dead Letter Queue for Lambda failed invocations
- Optional S3 bucket hardening policy (HTTPS-only + encryption enforcement)

## Deployment

### Prerequisites

- An active CloudTrail trail with CloudWatch Logs integration enabled
- IAM permissions to create SNS, CloudWatch, EventBridge, Lambda, and IAM resources

Before deploying, verify S3 bucket security:

> **IMPORTANT:** The CloudFormation template does NOT configure or validate these S3 bucket security settings. The stack deploys successfully even if prerequisites are not met, leaving your CloudTrail logs at risk. You MUST run all verification commands below and confirm all settings are correct before deploying the stack. Consider using a deployment script that runs these checks automatically and blocks deployment on failure.

**Run the pre-deployment validation script** (blocks deployment if any requirement is not met):

```bash
./scripts/validate-prerequisites.sh <your-bucket-name> <your-log-group-name>
```

If prerequisites are not yet configured, use these commands to set them up:

```bash
# Enable Block Public Access
aws s3api put-public-access-block --bucket <your-bucket-name> \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Enable default encryption (SSE-S3)
aws s3api put-bucket-encryption --bucket <your-bucket-name> \
  --server-side-encryption-configuration \
  '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Enable versioning
aws s3api put-bucket-versioning --bucket <your-bucket-name> \
  --versioning-configuration Status=Enabled

# Enable CloudWatch Logs encryption (required before deployment)
aws logs associate-kms-key \
  --log-group-name <your-log-group-name> \
  --kms-key-id <your-kms-key-arn>
```

Then verify all settings are correct before deploying:

```bash
# Block Public Access — all four settings should be true:
aws s3api get-public-access-block --bucket <your-bucket-name>

# Encryption — should show AES256 or aws:kms:
aws s3api get-bucket-encryption --bucket <your-bucket-name>

# Versioning — Status should be Enabled:
aws s3api get-bucket-versioning --bucket <your-bucket-name>

# CloudWatch Logs encryption — must NOT return null:
aws logs describe-log-groups --log-group-name-prefix <your-log-group-name> \
  --query 'logGroups[0].kmsKeyId'
```

### Deploy via AWS Console

1. Download `cloudtrail-security-monitoring.yaml`
2. Open the [AWS CloudFormation console](https://console.aws.amazon.com/cloudformation/)
3. Choose **Create stack → With new resources**
4. Upload the template and fill in the parameters
5. Acknowledge IAM capabilities and create the stack
6. Confirm the SNS subscription email that arrives in your inbox

### Deploy via AWS CLI

```bash
aws cloudformation deploy \
  --template-file cloudtrail-security-monitoring.yaml \
  --stack-name cloudtrail-security-monitoring \
  --parameter-overrides \
    CloudTrailLogGroupName=<your-log-group> \
    NotificationEmail=<your-email> \
    TrailName=<your-trail-name> \
    EnableAutoRemediation=true \
    CloudTrailLogBucketName=<your-bucket> \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM
```

### Parameters

| Parameter | Default | Description |
|---|---|---|
| `CloudTrailLogGroupName` | *(required)* | CloudWatch Logs log group receiving CloudTrail events |
| `NotificationEmail` | *(required)* | Email address for SNS alert notifications |
| `TrailName` | *(required)* | Name of the CloudTrail trail to protect |
| `EnableAutoRemediation` | `false` | Deploy Lambda to auto re-enable stopped trails |
| `CloudTrailLogBucketName` | *(optional)* | S3 bucket storing CloudTrail logs — when provided, a hardening bucket policy is applied |

> **Note:** Replace all `<placeholder>` values in the CLI command with your actual resource names before running.

## Alert Format

Alerts are delivered as human-readable emails:

```
⚠️ CloudTrail Security Alert

Event     : StopLogging
Trail     : my-trail
Time      : 2026-04-24T14:21:34Z
Region    : us-east-1
Account   : 123456789012

Who triggered this:
  User     : jsmith
  Type     : IAMUser
  ARN      : arn:aws:iam::123456789012:user/jsmith
  Source IP: 203.0.113.42

Action Required: Review this activity immediately and verify it was authorized.
```

## Implementation Priority

Deploy in this sequence to maximize security coverage from day one:

1. **Verify S3 bucket prerequisites** — Confirm the CloudTrail log bucket has Block Public Access, SSE encryption, versioning, and access logging enabled before deploying.
2. **Deploy detection-only stack** — Set `EnableAutoRemediation=false` to deploy the core detection layer first. Confirm SNS email subscription.
3. **Validate alerting** — Trigger a test event (for example, call `aws cloudtrail stop-logging` on a non-production trail) and confirm the SNS alert arrives.
4. **Enable S3 protection** — Provide `CloudTrailLogBucketName` to apply the hardening bucket policy to the CloudTrail log delivery bucket.
5. **Enable auto-remediation** — After validating detection, set `EnableAutoRemediation=true` to deploy the Lambda function and DLQ.
6. **Apply preventive controls** — Attach the `MonitoringStackProtectionPolicy` to IAM roles in your account. Apply an SCP if using AWS Organizations.
7. **Multi-region rollout** — Use CloudFormation StackSets to deploy to all regions with active trails.

## Data Security and Encryption

### Data Classification

The data handled by this solution is classified as **CONFIDENTIAL**. The Amazon SNS topic receives CloudTrail event details including IAM principal ARNs, source IP addresses, and API call parameters. This information must be protected from unauthorized disclosure. All personnel with access to Amazon SNS subscriptions or CloudWatch Logs must follow your organization's data handling procedures for CONFIDENTIAL data.

### AWS KMS Key Management

The SNS topic is encrypted using a customer-managed AWS KMS key (`AlertTopicKmsKey`) created by this stack:

- **Key rotation** — Automatic annual rotation is enabled by default.
- **Key policy** — Grants access to SNS, CloudWatch, EventBridge, and the account root. No other principals have access.
- **Key alias** — `alias/cloudtrail-monitoring-sns-<stack-name>` for easy identification.
- **Deletion policy** — The key has `DeletionPolicy: Retain`. To delete the key after stack deletion, schedule key deletion via the AWS KMS console (minimum 7-day waiting period).

> **BYOK Review Required:** This solution uses a customer-managed AWS KMS key (Bring Your Own Key pattern). Before deploying to production, your security team must review and approve: (1) the key policy grants in the CloudFormation template, (2) automatic key rotation is enabled, and (3) access controls are scoped to required service principals only. Document this review in your deployment approval record.

### Additional Encryption Recommendations

- Enable SSE on the SQS Dead Letter Queue using an AWS KMS key for production deployments.
- Encrypt the CloudTrail log group in CloudWatch Logs using an AWS KMS key.
- Use SSE-AWS KMS (not SSE-S3) on the CloudTrail log S3 bucket for stronger access control.

## Testing

```bash
pip install -r tests/requirements-test.txt
pytest tests/ -v
```

37 tests covering property-based tests (hypothesis), unit tests, and smoke tests for CFN and MDX structure.

## Clean Up

```bash
aws cloudformation delete-stack --stack-name cloudtrail-security-monitoring
aws sns delete-topic --topic-arn <AlertTopicArn>
```

## License

This library is licensed under the MIT-0 License.
