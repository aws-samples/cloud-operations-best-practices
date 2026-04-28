#!/usr/bin/env bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0
#
# validate-prerequisites.sh
# Pre-deployment validation script for cloudtrail-security-monitoring.yaml
#
# Usage: ./scripts/validate-prerequisites.sh <bucket-name> <log-group-name>
#
# Checks all required S3 bucket and CloudWatch Logs prerequisites before
# deploying the CloudTrail security monitoring stack. Exits with code 1
# if any requirement is not met, blocking deployment.

set -euo pipefail

BUCKET_NAME="${1:-}"
LOG_GROUP_NAME="${2:-}"
ERRORS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; ERRORS=$((ERRORS + 1)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

if [[ -z "$BUCKET_NAME" || -z "$LOG_GROUP_NAME" ]]; then
  echo "Usage: $0 <bucket-name> <log-group-name>"
  echo "Example: $0 my-cloudtrail-bucket aws-cloudtrail-logs"
  exit 1
fi

echo "=== CloudTrail Security Monitoring — Pre-Deployment Validation ==="
echo "Bucket    : $BUCKET_NAME"
echo "Log Group : $LOG_GROUP_NAME"
echo ""

# -----------------------------------------------------------------------
# S3 Bucket Checks
# -----------------------------------------------------------------------
echo "--- S3 Bucket Security ---"

# 1. Block Public Access
BPA=$(aws s3api get-public-access-block --bucket "$BUCKET_NAME" \
  --query 'PublicAccessBlockConfiguration' --output json 2>/dev/null || echo '{}')
if echo "$BPA" | grep -q '"BlockPublicAcls": true' && \
   echo "$BPA" | grep -q '"IgnorePublicAcls": true' && \
   echo "$BPA" | grep -q '"BlockPublicPolicy": true' && \
   echo "$BPA" | grep -q '"RestrictPublicBuckets": true'; then
  pass "Block Public Access: all four settings enabled"
else
  fail "Block Public Access: not fully enabled — run: aws s3api put-public-access-block --bucket $BUCKET_NAME --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
fi

# 2. Default encryption
ENC=$(aws s3api get-bucket-encryption --bucket "$BUCKET_NAME" \
  --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' \
  --output text 2>/dev/null || echo 'NONE')
if [[ "$ENC" == "AES256" || "$ENC" == "aws:kms" ]]; then
  pass "Default encryption: $ENC"
else
  fail "Default encryption: not configured — run: aws s3api put-bucket-encryption --bucket $BUCKET_NAME --server-side-encryption-configuration '{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}'"
fi

# 3. Versioning
VERSIONING=$(aws s3api get-bucket-versioning --bucket "$BUCKET_NAME" \
  --query 'Status' --output text 2>/dev/null || echo 'NONE')
if [[ "$VERSIONING" == "Enabled" ]]; then
  pass "Versioning: Enabled"
else
  fail "Versioning: not enabled — run: aws s3api put-bucket-versioning --bucket $BUCKET_NAME --versioning-configuration Status=Enabled"
fi

# 4. Access logging
LOGGING=$(aws s3api get-bucket-logging --bucket "$BUCKET_NAME" \
  --query 'LoggingEnabled.TargetBucket' --output text 2>/dev/null || echo 'None')
if [[ "$LOGGING" != "None" && -n "$LOGGING" ]]; then
  pass "Access logging: enabled (target: $LOGGING)"
else
  warn "Access logging: not configured — configure S3 server access logging to a destination bucket"
  ERRORS=$((ERRORS + 1))
fi

# 5. MFA Delete (informational — requires root credentials to enable)
MFA=$(aws s3api get-bucket-versioning --bucket "$BUCKET_NAME" \
  --query 'MFADelete' --output text 2>/dev/null || echo 'Disabled')
if [[ "$MFA" == "Enabled" ]]; then
  pass "MFA Delete: Enabled"
else
  warn "MFA Delete: not enabled — REQUIRED for production. Enable with root credentials:"
  warn "  aws s3api put-bucket-versioning --bucket $BUCKET_NAME \\"
  warn "    --versioning-configuration Status=Enabled,MFADelete=Enabled \\"
  warn "    --mfa \"<mfa-arn> <mfa-code>\""
fi

echo ""

# -----------------------------------------------------------------------
# CloudWatch Logs Check
# -----------------------------------------------------------------------
echo "--- CloudWatch Logs ---"

KMS_KEY=$(aws logs describe-log-groups \
  --log-group-name-prefix "$LOG_GROUP_NAME" \
  --query 'logGroups[0].kmsKeyId' --output text 2>/dev/null || echo 'None')
if [[ "$KMS_KEY" != "None" && -n "$KMS_KEY" ]]; then
  pass "CloudWatch Logs encryption: KMS key configured ($KMS_KEY)"
else
  fail "CloudWatch Logs encryption: log group '$LOG_GROUP_NAME' is NOT encrypted with a KMS key"
  fail "  This is REQUIRED — run: aws logs associate-kms-key --log-group-name $LOG_GROUP_NAME --kms-key-id <key-arn>"
fi

echo ""

# -----------------------------------------------------------------------
# Result
# -----------------------------------------------------------------------
if [[ $ERRORS -eq 0 ]]; then
  echo -e "${GREEN}=== All prerequisites met. Safe to deploy. ===${NC}"
  exit 0
else
  echo -e "${RED}=== $ERRORS prerequisite(s) not met. Fix the above issues before deploying. ===${NC}"
  exit 1
fi
