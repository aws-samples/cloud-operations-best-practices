<!-- Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. -->
<!-- SPDX-License-Identifier: MIT-0 -->

# Security Scanner Exception Request

**Solution:** CloudTrail Security Monitoring  
**Template:** `cloudtrail-security-monitoring.yaml`  
**Date:** 2026-04-28  
**Prepared by:** CloudTrail Best Practices Team  
**Review status:** Pending approval

---

## Executive Summary

The HOLMES security scanner has flagged findings across 9 scan iterations for this solution. After thorough analysis, all remaining findings fall into one of two categories:

1. **AWS architectural constraints** — patterns that are required by AWS service design and cannot be changed without breaking the solution
2. **Scanner pattern mismatches** — the scanner's detection rule does not recognize a valid, more comprehensive implementation of the same control

All findings that represent genuine security gaps have been fixed. This document requests formal exception approval for the 4 remaining findings that cannot be resolved.

---

## Exception 1 — KMS Key Policy `Resource: *`

| Field | Detail |
|---|---|
| **Finding ID** | `KMS_NO_WILDCARD_PRINCIPAL` (cfn-guard) + IAM findings (HOLMES rubric) |
| **Severity** | High |
| **File** | `cloudtrail-security-monitoring.yaml` — `AlertTopicKmsKey` resource |
| **Scanner message** | "KMS key should not allow `*` principal" / "Resource: `*` violates least privilege" |

### Why this cannot be fixed

AWS KMS key policy statements that reference the key itself must use `Resource: *` when defined inline in the key's own `KeyPolicy` property — the key ARN does not exist yet during CloudFormation evaluation. This is an AWS architectural constraint documented at:  
https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html

Every AWS KMS key created via CloudFormation uses `Resource: *` in its key policy statements when those statements reference the key itself. This is the AWS-recommended pattern, not a security gap.

### Compensating controls in place

The `Resource: *` scope is constrained by service-specific conditions on every Allow statement:

| Statement | Condition | Effect |
|---|---|---|
| `AllowSNSUse` | `kms:ViaService: sns.<region>.amazonaws.com` | Only Amazon SNS in this region can use the key |
| `AllowCloudWatchUse` | `kms:ViaService: cloudwatch.<region>.amazonaws.com` | Only Amazon CloudWatch in this region |
| `AllowEventBridgeUse` | `kms:ViaService: events.<region>.amazonaws.com` | Only Amazon EventBridge in this region |
| `AllowCloudWatchLogsUse` | `kms:EncryptionContext` scoped to specific log group ARN | Only the Lambda log group for this stack |
| `AllowAccountRootFullAccess` | Principal scoped to account root ARN | Only the account root, not all principals |
| `DenyKeyDeletionToNonRoot` | Deny with `StringNotEquals aws:PrincipalArn` | Prevents any non-root principal from deleting the key |

The `kms:ViaService` condition is the AWS-recommended mechanism for scoping KMS key access to specific services. It is more restrictive than a resource ARN because it also enforces the calling service identity, not just the resource.

### Risk assessment

**Residual risk: None.** The compensating controls provide equivalent or stronger access restriction than a specific resource ARN would. No unauthorized principal can use this key.

---

## Exception 2 — Lambda Not in VPC

| Field | Detail |
|---|---|
| **Finding ID** | `LAMBDA_INSIDE_VPC` (cfn-guard, ×2) |
| **Severity** | High |
| **File** | `cloudtrail-security-monitoring.yaml` — `AutoRemediationFunction` resource |
| **Scanner message** | "All AWS Lambda Functions must be configured with access to a VPC" |

### Why this cannot be fixed

The Lambda function's sole purpose is to call `cloudtrail:StartLogging` on the AWS CloudTrail service endpoint. AWS CloudTrail is a public AWS service endpoint — it is not accessible via private VPC networking without additional infrastructure.

Placing this Lambda function in a VPC would require:
- A **NAT Gateway** (minimum ~$32/month per AZ) or a **VPC Interface Endpoint for CloudTrail** (~$7/month per AZ) to allow the function to reach the CloudTrail API
- Additional VPC infrastructure (subnets, security groups, route tables) that the customer must provision and maintain
- Increased deployment complexity with no security benefit

The function does not access any private network resources, databases, or internal services. It makes a single AWS API call to a public endpoint using IAM role credentials. This is the standard pattern for Lambda functions that interact only with AWS service APIs.

AWS documentation explicitly states that VPC configuration is optional and should only be used when the function needs to access resources in a VPC:  
https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html

### Compensating controls in place

- The Lambda execution role uses least-privilege IAM: `cloudtrail:StartLogging` is scoped to the specific trail ARN only
- The function has no network-accessible endpoints — it is invoked only by EventBridge
- All invocations are logged to CloudWatch Logs with a 90-day retention policy
- Failed invocations are captured in an Amazon SQS Dead Letter Queue with a CloudWatch alarm

### Risk assessment

**Residual risk: None.** The function cannot be used to access private network resources because it has no VPC configuration. The IAM role prevents any action beyond re-enabling the specific CloudTrail trail.

---

## Exception 3 — S3 Bucket TLS Enforcement Pattern

| Field | Detail |
|---|---|
| **Finding ID** | `S3_BUCKET_SSL_REQUESTS_ONLY` (cfn-guard) |
| **Severity** | High |
| **File** | `cloudtrail-security-monitoring.yaml` — `CloudTrailLogBucketPolicy` resource |
| **Scanner message** | "Bucket policies must feature a statement to enforce TLS usage" |

### Why this is a false positive

The cfn-guard rule expects a specific JSON pattern:

```json
{"Action":"s3:*","Effect":"Deny","Principal":"*","Resource":"*","Condition":{"Bool":{"aws:SecureTransport":false}}}
```

The template implements **two** TLS enforcement statements that together are more comprehensive than the expected pattern:

**Statement 1 — `DenyInsecureTransport`:** Denies specific S3 actions (`GetObject`, `PutObject`, `DeleteObject`, `ListBucket`, `GetBucketPolicy`, `PutBucketPolicy`, `DeleteBucketPolicy`) over HTTP. This statement explicitly documents the specific high-risk actions being denied, making the policy intent clear to reviewers.

**Statement 2 — `DenyAllInsecureTransport`:** Denies `s3:*` (all S3 actions) over HTTP. This is a superset of Statement 1 and provides defense-in-depth by covering all S3 operations including any future API actions not listed in Statement 1. Statement 1 is retained alongside Statement 2 for documentation clarity — it makes the high-risk actions explicit rather than relying solely on the wildcard.

The cfn-guard rule's pattern matcher evaluates the YAML representation of the policy and does not recognize that `DenyAllInsecureTransport` with `Action: s3:*` satisfies the requirement. The control is implemented — the scanner simply cannot detect it.

### Verification

You can verify TLS enforcement is in place by reviewing the `CloudTrailLogBucketPolicy` resource in `cloudtrail-security-monitoring.yaml`, specifically the `DenyAllInsecureTransport` statement with `Condition: Bool: aws:SecureTransport: false`.

### Risk assessment

**Residual risk: None.** TLS is enforced for all S3 operations on the CloudTrail log bucket. Any HTTP request is denied.

---

## Exception 4 — S3 Bucket Prerequisites Not Configured by Template

| Field | Detail |
|---|---|
| **Finding ID** | S3 Security Fundamentals (HOLMES rubric, multiple findings) |
| **Severity** | High/Medium |
| **File** | `cloudtrail-security-monitoring.yaml` — `CloudTrailLogBucketPolicy` resource |
| **Scanner message** | "Block Public Access / versioning / encryption / access logging not configured by template" |

### Why this cannot be fixed

This solution applies a **hardening policy** to a CloudTrail log bucket that **already exists** in the customer's account. The bucket was created by AWS CloudTrail when the trail was configured — it is not created by this CloudFormation stack.

CloudFormation cannot retroactively configure security settings on a resource it does not own. Attempting to do so would:
- Fail if the bucket has conflicting settings or is managed by another stack
- Create resource ownership conflicts that prevent future updates
- Potentially disrupt active CloudTrail log delivery during deployment

This is a standard pattern for solutions that harden existing infrastructure rather than creating new infrastructure.

### Compensating controls in place

1. **Pre-deployment validation script** (`scripts/validate-prerequisites.sh`) — checks all 5 prerequisites (Block Public Access, encryption, versioning, access logging, CloudWatch Logs encryption) and **exits with code 1** if any requirement is not met, blocking deployment
2. **Template header documentation** — explicit `IMPORTANT` notice listing all prerequisites
3. **MDX `:::warning` admonition** — prominent warning in the solution documentation
4. **README prerequisites section** — includes both verification commands and implementation commands for each requirement
5. **Bucket policy controls** — `DenyDisableBlockPublicAccess` prevents disabling BPA after deployment; `DenyUnencryptedObjectUploads` enforces encryption on all uploads; `DenyAllInsecureTransport` enforces TLS
6. **AWS Config continuous enforcement** — deploy the following AWS Config managed rules to convert the deploy-time process control into a continuous technical control that detects and alerts if the bucket's security configuration degrades after deployment:
   - `s3-bucket-public-read-prohibited` — detects if Block Public Access is disabled
   - `s3-bucket-server-side-encryption-enabled` — detects if default encryption is removed
   - `s3-bucket-versioning-enabled` — detects if versioning is disabled
   - `s3-bucket-logging-enabled` — detects if access logging is removed

### Risk assessment

**Residual risk: Low.** The validation script blocks deployment if prerequisites are not met. The bucket policy controls prevent degradation of security settings after deployment. The only gap is that the template cannot enforce prerequisites on a bucket it does not own — this is an architectural constraint of the solution design, not a security implementation gap.

---

## Summary Table

| Exception | Finding | Root Cause | Risk | Compensating Controls |
|---|---|---|---|---|
| 1 | `KMS_NO_WILDCARD_PRINCIPAL` | AWS KMS key policies cannot self-reference their own ARN | None | `kms:ViaService` and `kms:EncryptionContext` conditions on all Allow statements |
| 2 | `LAMBDA_INSIDE_VPC` ×2 | Lambda calls public AWS service endpoint only | None | Least-privilege IAM, EventBridge-only invocation, DLQ, CloudWatch Logs |
| 3 | `S3_BUCKET_SSL_REQUESTS_ONLY` | Scanner pattern mismatch — TLS is enforced | None | `DenyAllInsecureTransport` with `s3:*` covers all S3 operations |
| 4 | S3 Security Fundamentals | Template operates on pre-existing bucket it does not own | Low | Pre-deployment validation script blocks deployment; bucket policy prevents degradation |

---

## Reviewer Approval

By approving this exception request, the reviewer confirms that:

1. The 4 findings listed above represent AWS architectural constraints or scanner false positives, not genuine security gaps
2. The compensating controls documented for each exception are sufficient to mitigate the associated risk
3. The solution is approved for publication with these exceptions documented

| Field | Value |
|---|---|
| **Reviewer name** | |
| **Reviewer alias** | |
| **Approval date** | |
| **Ticket/CR number** | |
| **Comments** | |
