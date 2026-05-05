<!-- Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. -->
<!-- SPDX-License-Identifier: MIT-0 -->

# Contributor Guide — How This Solution Was Built and Published

This guide documents the end-to-end process for building and publishing a solution to the AWS Cloud Operations Best Practices site. Use this as a reference if you are contributing a new solution.

---

## Phase 1 — Build the Solution

### 1.1 CloudFormation Template
- Write the CFN template with all resources
- Use `cfn-lint` locally to validate: `cfn-lint your-template.yaml`
- Key things the scanner will check:
  - No inline IAM policies — use `AWS::IAM::ManagedPolicy` instead
  - KMS key policies require `Resource: *` — this is an AWS architectural constraint, document it with inline comments
  - Lambda not in VPC will be flagged — document the justification in a comment
  - S3 TLS enforcement — use `DenyAllInsecureTransport` with `Action: s3:*`

### 1.2 Write Tests
- Write pytest tests covering CFN structure, Lambda handler, and MDX structure
- Run: `python -m pytest tests/ -v`
- Use `# nosec B506` for yaml.load with SafeLoader-based custom loaders
- All tests must pass before submitting

### 1.3 Write Documentation (MDX)
- Create the MDX file under `docs/solutions/<service>/`
- Keep it concise — aim for under 300 lines
- Required sections (scanner will check): Architecture, Security Responsibilities, Prerequisites, Deployment, Data Security, Residual Risks
- Do NOT use Mermaid diagrams — the Docusaurus site does not have Mermaid configured. Use static SVG images instead
- Place SVG images under `static/img/solutions/<solution-name>/`
- Preview locally: `cd cloud-operations-best-practices && npm run start`

### 1.4 Write README
- Place in `static/cfn-templates/<solution-name>/README.md`
- Include: overview, shared responsibility table, architecture diagram, deployment steps, parameters table, data security section

### 1.5 Write Pre-Deployment Validation Script
- Place in `static/cfn-templates/<solution-name>/scripts/validate-prerequisites.sh`
- Script must exit with code 1 if any prerequisite is not met
- This is required by the security scanner to address S3 prerequisite findings

---

## Phase 2 — Security Review (HOLMES Scanner)

### 2.1 Prepare Files for Upload
Upload only these source files (no `.git`, no test folder):
1. `cloudtrail-security-monitoring.yaml`
2. `docs/cloudtrail-tampering-detection.mdx`
3. `README.md`
4. `CODESCANRESULTS.md`
5. `SECURITY-EXCEPTIONS.md`
6. `scripts/validate-prerequisites.sh`
7. `threat-model/<threat-model-final>.md`

### 2.2 Run Bandit Scan Locally First
```bash
bandit -r tests/ lambda_handler.py -f txt
```
Document all findings in `CODESCANRESULTS.md` with justifications before uploading to HOLMES.

### 2.3 Upload to HOLMES Scanner
- Upload files to the HOLMES portal (internal Amazon security scanner)
- Expect multiple scan iterations — the rubric scanner is non-deterministic and will find new things each round
- Fix everything that is genuinely fixable
- For findings that cannot be fixed, document them in `SECURITY-EXCEPTIONS.md`

### 2.4 Permanent False Positives (will appear in every scan)
These 4 findings will always appear and cannot be fixed:

| Finding | Why it cannot be fixed |
|---|---|
| `KMS_NO_WILDCARD_PRINCIPAL` | AWS requires `Resource: *` in KMS key policies — key cannot reference its own ARN during creation |
| `LAMBDA_INSIDE_VPC` ×2 | Lambda calls public AWS service endpoints only — VPC adds cost with no security benefit |
| `S3_BUCKET_SSL_REQUESTS_ONLY` | TLS is enforced via `DenyAllInsecureTransport` — scanner pattern mismatch |
| S3 prerequisites not configured | Template operates on pre-existing bucket it doesn't own |

Document these in `SECURITY-EXCEPTIONS.md` with compensating controls and submit for exception approval.

### 2.5 Key Lessons from Scanner
- Replace `ensures` with `enforces`, `applies`, or `provides` — scanner flags "ensures" as superlative language
- Use `AWS KMS` not standalone `KMS` — scanner flags standalone `KMS` as naming violation
- Use `AWS Config` not standalone `Config`
- First mention of every AWS service must use full form: `Amazon Simple Queue Service (Amazon SQS)`
- No inline IAM policies — always use managed policies
- `CODESCANRESULTS.md` must document ALL code scans including production Lambda code and CFN template scans, not just test files

---

## Phase 3 — Threat Model

### 3.1 Run Threat Model
- Use the Threat Modeling MCP Server
- Run all phases: scope, data flows, threats, mitigations, residual risks, final report
- Save the final report as `threat-model/<solution-name>-vX-final.md`
- The threat model is required for the security review submission

---

## Phase 4 — End-to-End Testing in AWS

### 4.1 Deploy the Stack
```bash
aws cloudformation deploy \
  --template-file cloudtrail-security-monitoring.yaml \
  --stack-name cloudtrail-security-monitoring-test \
  --parameter-overrides \
    CloudTrailLogGroupName=<log-group> \
    NotificationEmail=<email> \
    TrailName=<trail-name> \
    EnableAutoRemediation=true \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --profile <profile> \
  --region us-east-1
```

### 4.2 Test Auto-Remediation
```bash
aws cloudtrail stop-logging --name <trail-name> --profile <profile> --region us-east-1
# Wait 30 seconds
aws cloudtrail get-trail-status --name <trail-name> --query 'IsLogging' --profile <profile> --region us-east-1
# Should return True
```

### 4.3 Email Alert Notes
- Do NOT use Gmail for SNS email subscriptions — Gmail's spam filter auto-clicks the unsubscribe link
- Use a corporate or Outlook email address
- Amazon internal email (`@amazon.com`) may block SNS emails — check spam/quarantine

### 4.4 Clean Up
```bash
aws cloudformation delete-stack --stack-name cloudtrail-security-monitoring-test --profile <profile> --region us-east-1
```

---

## Phase 5 — Publishing to Cloud Operations Best Practices Site

### 5.1 Get Domain Owner Approval
- For AWS CloudTrail content: **Isaiah Salinas — ezsali@amazon.com**
- Email him with:
  - Fork branch URL for review
  - Word doc of the best practices guide page (convert MDX to Word using `pandoc`)
  - Summary of what the solution does

### 5.2 Isaiah's Process (important — read carefully)
Isaiah requires TWO separate things:
1. **aws-samples repo** — a dedicated public repo for the solution code (CFN template, scripts) — requires an OpenSource approval ticket
2. **Best practices guide page** — write as a Word doc first, get Isaiah's approval, then convert to MDX and submit PR

### 5.3 Fork and Submit PR
```bash
# Add your fork as remote
git remote add fork https://github.com/<your-github>/cloud-operations-best-practices.git

# Create a branch
git checkout -b <solution-name>

# Stage only customer-facing files
git add docs/solutions/<service>/<solution>.mdx
git add static/cfn-templates/<solution-name>/
git add static/img/solutions/<solution-name>/

# Commit and push
git commit -m "Add <solution name> solution"
git push fork <solution-name>
```

Then open a PR at: `https://github.com/<your-github>/cloud-operations-best-practices/pull/new/<branch>`

### 5.4 What Goes in the PR (public GitHub)
| File | Include? |
|---|---|
| MDX documentation page | ✅ Yes |
| CloudFormation template | ✅ Yes |
| README.md | ✅ Yes |
| scripts/validate-prerequisites.sh | ✅ Yes |
| Architecture diagram SVG | ✅ Yes |
| CODESCANRESULTS.md | ❌ No — internal |
| SECURITY-EXCEPTIONS.md | ❌ No — internal |
| threat-model/ | ❌ No — internal |
| tests/ | ❌ No — not customer-facing |

---

## Key Tools and Commands

| Task | Command |
|---|---|
| Validate CFN template | `cfn-lint template.yaml` |
| Run tests | `python -m pytest tests/ -v` |
| Run Bandit scan | `bandit -r tests/ lambda_handler.py` |
| Preview site locally | `cd cloud-operations-best-practices && npm run start` |
| Convert MDX to Word | `pandoc docs/solution.mdx -o solution.docx` |
| Deploy CFN stack | `aws cloudformation deploy ...` |
| Delete CFN stack | `aws cloudformation delete-stack --stack-name <name>` |

---

## Staging Folder

Keep a clean staging folder (e.g., `~/sample-<solution-name>-clean/`) with only the files to be uploaded to the HOLMES scanner. This avoids accidentally uploading test files or internal documents.

Always sync workspace changes to the staging folder before uploading to HOLMES:
```bash
cp template.yaml ~/sample-solution-clean/
cp docs/solution.mdx ~/sample-solution-clean/docs/
# etc.
```

---

## Important Lessons Learned

1. **Never paste code or heredocs into the terminal** — always use file-writing tools. Pasting multi-line content breaks the terminal session.
2. **Gmail auto-unsubscribes from SNS** — use a non-Gmail address for testing SNS email alerts.
3. **HOLMES scanner is non-deterministic** — it finds new things each scan even after fixes. After ~5 rounds, document remaining findings as exceptions rather than continuing to chase the scanner.
4. **Mermaid diagrams don't work** on the Docusaurus site — use static SVG images.
5. **Isaiah's process** — Word doc review comes BEFORE the PR, not after.
6. **Test in a clean AWS account** — check for existing stacks and named IAM resources before deploying to avoid conflicts.
7. **SNS subscription confirmation** — must be clicked before alerts are delivered. The `SubscriptionsPending` count on the topic tells you if it's confirmed.
