"use strict";(self.webpackChunkaws_cloud_operations_best_practices=self.webpackChunkaws_cloud_operations_best_practices||[]).push([[5],{4366:(e,n,t)=>{t.d(n,{A:()=>s});const s=t.p+"assets/images/example-1-command-output-c54ec8709583b5f03c2b863bac9cfa60.png"},4503:(e,n,t)=>{t.d(n,{A:()=>s});const s=t.p+"assets/images/example-2-command-output-0c280a649cad29b47b682ccf925ce141.png"},4607:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>i,default:()=>l,frontMatter:()=>a,metadata:()=>s,toc:()=>m});const s=JSON.parse('{"id":"recipes/centralized-operations-management/pwsh-run-command-custom-credentials/index","title":"Invoking PowerShell commands as a custom Windows user in Systems Manager Run Command","description":"By default, Systems Manager Run Command uses the local SYSTEM account to run commands on Windows managed nodes. However, in certain scenarios, operations engineers require custom user permissions when running commands. For example, to run Active Directory Domain tasks or to scope down the privileges for the command session.","source":"@site/docs/recipes/centralized-operations-management/pwsh-run-command-custom-credentials/index.md","sourceDirName":"recipes/centralized-operations-management/pwsh-run-command-custom-credentials","slug":"/recipes/centralized-operations-management/pwsh-run-command-custom-credentials/","permalink":"/cloud-operations-best-practices/docs/recipes/centralized-operations-management/pwsh-run-command-custom-credentials/","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"sidebar_position":1},"sidebar":"tutorialSidebar","previous":{"title":"Centralized Operations Management","permalink":"/cloud-operations-best-practices/docs/recipes/centralized-operations-management/"},"next":{"title":"FAQ","permalink":"/cloud-operations-best-practices/docs/faq/"}}');var r=t(4848),o=t(8453);const a={sidebar_position:1},i="Invoking PowerShell commands as a custom Windows user in Systems Manager Run Command",c={},m=[{value:"Use a custom Run Command document to automatically assume custom credentials and run a PowerShell script",id:"use-a-custom-run-command-document-to-automatically-assume-custom-credentials-and-run-a-powershell-script",level:2}];function d(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",header:"header",img:"img",p:"p",pre:"pre",...(0,o.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.header,{children:(0,r.jsx)(n.h1,{id:"invoking-powershell-commands-as-a-custom-windows-user-in-systems-manager-run-command",children:"Invoking PowerShell commands as a custom Windows user in Systems Manager Run Command"})}),"\n",(0,r.jsxs)(n.p,{children:["By default, ",(0,r.jsx)(n.a,{href:"https://docs.aws.amazon.com/systems-manager/latest/userguide/run-command.html",children:"Systems Manager Run Command"})," uses the local ",(0,r.jsx)(n.code,{children:"SYSTEM"})," account to run commands on Windows managed nodes. However, in certain scenarios, operations engineers require custom user permissions when running commands. For example, to run Active Directory Domain tasks or to scope down the privileges for the command session."]}),"\n",(0,r.jsxs)(n.p,{children:["When handling user credentials in PowerShell, we recommend storing them in ",(0,r.jsx)(n.a,{href:"https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html",children:"AWS Secrets Manager"})," and retrieving them programmatically from the script. This avoids exposing the credentials in plain text at any point of the execution."]}),"\n",(0,r.jsx)(n.admonition,{type:"info",children:(0,r.jsxs)(n.p,{children:["The managed node must have permissions to access the secret in Secrets Manager. Permissions can be granted to the EC2 IAM instance profile attached, the IAM service role specified in your ",(0,r.jsx)(n.a,{href:"https://docs.aws.amazon.com/systems-manager/latest/userguide/fleet-manager-default-host-management-configuration.html",children:"Default Host Management Configuration"})," (DHMC) service setting, or the IAM service role for the ",(0,r.jsx)(n.a,{href:"https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-hybrid-multicloud.html",children:"hybrid managed node"}),". For more information, see ",(0,r.jsx)(n.a,{href:"https://docs.aws.amazon.com/mediaconnect/latest/ug/iam-policy-examples-asm-secrets.html",children:"IAM policy examples for secrets in AWS Secrets Manager"}),"."]})}),"\n",(0,r.jsx)(n.p,{children:"The below example shows a script to retrieve Domain credentials from Secrets Manager and run a PowerShell script with those credentials:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-powershell",metastring:"showLineNumbers",children:"# Retrieves AWS Secrets Manager secret\n$SecretContent = Get-SECSecretValue -SecretId <SECRET_ARN> -ErrorAction Stop | Select-Object -ExpandProperty 'SecretString' | ConvertFrom-Json -ErrorAction Stop\n\n# Creates credentials object\n$Username = $SecretContent.username\n$UserPassword = ConvertTo-SecureString ($SecretContent.password) -AsPlainText -Force\n$Credentials = New-Object -TypeName 'System.Management.Automation.PSCredential' ($Username, $UserPassword)\n\n# Run commands with Domain Credentials\nInvoke-Command -Authentication 'CredSSP' `\n    -ComputerName $env:COMPUTERNAME `\n    -Credential $Credentials `\n    -ScriptBlock {Write-Host \"Logged in as:\"$(whoami)}\n"})}),"\n",(0,r.jsx)(n.p,{children:"The output in Run Command shows the successful log in as the desired domain user:"}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"Run Command output with CredSSP",src:t(4366).A+"",width:"1710",height:"1083"})}),"\n",(0,r.jsxs)(n.p,{children:["Another alternative is using PowerShell Session (",(0,r.jsx)(n.code,{children:"PSSession"}),"). The following code also uses Secrets Manager to retrieve Local Administrator credentials and run a command under this context:"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-powershell",metastring:"showLineNumbers",children:"# Retrieves AWS Secrets Manager secret\n$SecretContent = Get-SECSecretValue -SecretId <SECRET_ARN> -ErrorAction Stop | Select-Object -ExpandProperty 'SecretString' | ConvertFrom-Json -ErrorAction Stop\n\n# Creates credentials object\n$Username = $SecretContent.username\n$UserPassword = ConvertTo-SecureString ($SecretContent.password) -AsPlainText -Force\n$Credentials = New-Object -TypeName 'System.Management.Automation.PSCredential' (\"$Env:ComputerName\\$Username\", $UserPassword)\n\n# Creates a new PowerShell session on the local computer using provided credentials\n$Session = New-PSSession -ComputerName $Env:ComputerName -Credential $Credentials -ErrorAction Stop\n\n# Runs a command in the remote session to start a process and wait for completion\nInvoke-Command -Session $Session -ScriptBlock { Write-Host \"Logged in as: $env:USERNAME\" }\n"})}),"\n",(0,r.jsx)(n.p,{children:"The below image shows the Run Command output after running this PowerShell script:"}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"Run Command output with PSSession",src:t(4503).A+"",width:"3470",height:"1910"})}),"\n",(0,r.jsxs)(n.admonition,{type:"note",children:[(0,r.jsx)(n.p,{children:"The Secrets Manager secret used on these examples stores credentials in the following key/value pair format:"}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-json",children:'{"username":"XXXXXXXXX","password":"XXXXXXX"}\n'})})]}),"\n",(0,r.jsxs)(n.p,{children:["Find more details on creating a Secrets Manager secret ",(0,r.jsx)(n.a,{href:"https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html",children:"here"}),"."]}),"\n",(0,r.jsx)(n.h2,{id:"use-a-custom-run-command-document-to-automatically-assume-custom-credentials-and-run-a-powershell-script",children:"Use a custom Run Command document to automatically assume custom credentials and run a PowerShell script"}),"\n",(0,r.jsxs)(n.p,{children:["To automate the secret retrieval and credentials manipulations, you can ",(0,r.jsx)(n.a,{href:"https://aws.amazon.com/blogs/mt/writing-your-own-aws-systems-manager-documents/",children:"create"})," a custom Run Command document with the below content:"]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-yaml",children:'schemaVersion: \'2.2\'\ndescription: "Command document example to retrieve a secret from AWS Secrets Manager and run a PowerShell command using the credentials"\nparameters:\n  SecretId:\n    type: String\n    description: The ARN or name of the secret to retrieve. To retrieve a secret from another account, you must use an ARN.\n    default: Secret ARN or Name\n  Command:\n    type: String\n    description: "Run a PowerShell script."\n    default: Write-Host "Logged in as:"$(whoami)\n    displayType: textarea\nmainSteps:\n  - action: aws:runPowerShellScript\n    name: ExecutePowerShellCommand\n    inputs:\n      runCommand:\n        - |\n           # Retrieves AWS Secrets Manager secret\n            $SecretContent = Get-SECSecretValue -SecretId {{SecretId}} -ErrorAction Stop | Select-Object -ExpandProperty \'SecretString\' | ConvertFrom-Json -ErrorAction Stop\n  \n            # Creates credentials object\n            $Username = $SecretContent.username\n            $UserPassword = ConvertTo-SecureString ($SecretContent.password) -AsPlainText -Force\n            $Credentials = New-Object -TypeName \'System.Management.Automation.PSCredential\' ("$Env:ComputerName\\$Username", $UserPassword)\n  \n            # Creates a new PowerShell session on the local computer using provided credentials\n            $Session = New-PSSession -ComputerName $Env:ComputerName -Credential $Credentials -ErrorAction Stop\n  \n            # Runs a command in the remote session to start a process and wait for completion\n            Invoke-Command -Session $Session -ScriptBlock { {{Command}} } -ErrorAction Stop\n'})}),"\n",(0,r.jsx)(n.p,{children:"As a result, you will have a template document which only requires Secret ARN and script content for each invocation:"}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"Custom Run Command Doc settings",src:t(8248).A+"",width:"1527",height:"1202"})}),"\n",(0,r.jsx)(n.p,{children:"A successful command invocation will show the following results:"}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"Custom Run Command Doc output",src:t(9208).A+"",width:"1594",height:"1001"})})]})}function l(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}},8248:(e,n,t)=>{t.d(n,{A:()=>s});const s=t.p+"assets/images/custom-command-doc-settings-a009debf44714d8193c034e228bb722e.png"},8453:(e,n,t)=>{t.d(n,{R:()=>a,x:()=>i});var s=t(6540);const r={},o=s.createContext(r);function a(e){const n=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function i(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:a(e.components),s.createElement(o.Provider,{value:n},e.children)}},9208:(e,n,t)=>{t.d(n,{A:()=>s});const s=t.p+"assets/images/custom-command-doc-output-8809102549e0ae3c66a90ac323d1e5ea.png"}}]);