# Executing PowerShell commands as a custom Windows user in Systems Manager Run Command

By default, [Systems Manager Run Command](https://docs.aws.amazon.com/systems-manager/latest/userguide/run-command.html) uses the local `SYSTEM` account to execute commands on Windows managed nodes. However, in certain scenarios, operations engineers require custom user permissions when running these commands. For example, to execute Active Directory Domain tasks or to scope down the privileges for the command session.

When handling user credentials in PowerShell, we recommend storing them in [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html) and retrieving them programmatically from the script. This avoids exposing the credentials in plain text at any point of the execution. The below example shows a script to retrieve Domain credentials from Secrets Manager and execute a PowerShell script with those credentials: 
```
# Retrieves AWS Secrets Manager secret
$SecretContent = Get-SECSecretValue -SecretId <SECRET_ARN> -ErrorAction Stop | Select-Object -ExpandProperty 'SecretString' | ConvertFrom-Json -ErrorAction Stop

# Creates credentials object
$Username = $SecretContent.username
$UserPassword = ConvertTo-SecureString ($SecretContent.password) -AsPlainText -Force
$Credentials = New-Object -TypeName 'System.Management.Automation.PSCredential' ($Username, $UserPassword)

#Executes commands with Domain Credentials
Invoke-Command -Authentication 'CredSSP' `
    -ComputerName $env:COMPUTERNAME `
    -Credential $Credentials `
    -ScriptBlock {Write-Host "Logged in as:"$(whoami)}
```

Output shows successful log in as the desired domain user:

![Run Command output with CredSSP](/img/recipes/pwsh-run-command-custom-credentials/example-1-command-output.png)

&nbsp;

Another alternative is using PowerShell Session (`PSSession`). The following code also uses Secrets Manager to retrieve Local Administrator credentials and execute a command under this context:
```
# Retrieves AWS Secrets Manager secret
$SecretContent = Get-SECSecretValue -SecretId <SECRET_ARN> -ErrorAction Stop | Select-Object -ExpandProperty 'SecretString' | ConvertFrom-Json -ErrorAction Stop

# Creates credentials object
$Username = $SecretContent.username
$UserPassword = ConvertTo-SecureString ($SecretContent.password) -AsPlainText -Force
$Credentials = New-Object -TypeName 'System.Management.Automation.PSCredential' ("$Env:ComputerName\$Username", $UserPassword)

# Creates a new PowerShell session on the local computer using provided credentials
$Session = New-PSSession -ComputerName $Env:ComputerName -Credential $Credentials -ErrorAction Stop

# Executes a command in the remote session to start a process and wait for completion
Invoke-Command -Session $Session -ScriptBlock { Write-Host "Logged in as: $env:USERNAME" }
```
The below image shows the Run Command output after executing this PowerShell script:

![Run Command output with PSSession](/img/recipes/pwsh-run-command-custom-credentials/example-2-command-output.png)


 Note: the Secrets Manager secret used on these examples stores credentials in the following key/value pair format: 
```
{"username":"XXXXXXXXX","password":"XXXXXXX"}
```
Find more details on creating a Secrets Manager secret [here](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html). You also need to provision the instance with permissions to access this secret, an example policy can be found [here](https://docs.aws.amazon.com/secretsmanager/latest/userguide/auth-and-access_iam-policies.html#auth-and-access_examples_identity_read).  

## Use a custom Run Command document to automatically assume custom credentials and execute a PowerShell script
To automate the secret retrieval and credentials manipulations, you can [create](https://aws.amazon.com/blogs/mt/writing-your-own-aws-systems-manager-documents/) a custom Run Command document with the below content:

```
schemaVersion: '2.2'
description: "Command document example to retrieve a secret from AWS Secrets Manager and run a PowerShell command using the credentials"
parameters:
  SecretId:
    type: String
    description: The ARN or name of the secret to retrieve. To retrieve a secret from another account, you must use an ARN.
    default: Secret ARN or Name
  Command:
    type: String
    description: "Run a PowerShell script."
    default: Write-Host "Logged in as:"$(whoami)
    displayType: textarea
mainSteps:
  - action: aws:runPowerShellScript
    name: ExecutePowerShellCommand
    inputs:
      runCommand:
        - |
           # Retrieves AWS Secrets Manager secret
            $SecretContent = Get-SECSecretValue -SecretId {{SecretId}} -ErrorAction Stop | Select-Object -ExpandProperty 'SecretString' | ConvertFrom-Json -ErrorAction Stop
  
            # Creates credentials object
            $Username = $SecretContent.username
            $UserPassword = ConvertTo-SecureString ($SecretContent.password) -AsPlainText -Force
            $Credentials = New-Object -TypeName 'System.Management.Automation.PSCredential' ("$Env:ComputerName\$Username", $UserPassword)
  
            # Creates a new PowerShell session on the local computer using provided credentials
            $Session = New-PSSession -ComputerName $Env:ComputerName -Credential $Credentials -ErrorAction Stop
  
            # Executes a command in the remote session to start a process and wait for completion
            Invoke-Command -Session $Session -ScriptBlock { {{Command}} } -ErrorAction Stop
```
As a result, you will have a template document which only requires Secret ARN and script content for every execution: 

![Custom Run Command Doc settings](/img/recipes/pwsh-run-command-custom-credentials/custom-command-doc-settings.png)

A successful document execution will show the following results: 

![Custom Run Command Doc output](/img/recipes/pwsh-run-command-custom-credentials/custom-command-doc-output.png)


