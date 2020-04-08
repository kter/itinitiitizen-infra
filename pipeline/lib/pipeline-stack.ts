import * as codebuild from '@aws-cdk/aws-codebuild';
import * as cloudformation from '@aws-cdk/aws-cloudformation';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { App, Stack, StackProps, SecretValue } from '@aws-cdk/core';
import * as ssm from '@aws-cdk/aws-ssm';
import { Role, PolicyStatement, Effect, ServicePrincipal}from '@aws-cdk/aws-iam';


const ownerName = 'kter';
const repositoryName = "itinitiitizen-infra";
const branch = 'master';
const awsRegion = 'ap-northeast-1';
const changeSetName = 'infra';

export class PipelineStack extends Stack {
  constructor(app: App, id: string, props?: StackProps) {
    super(app, id, props);

    const infraBuild = new codebuild.PipelineProject(this, 'infraBuild', {
      buildSpec: codebuild.BuildSpec.fromSourceFilename('infra-buildspec.yml'),
      environmentVariables: {
        AWS_REGION: { value: awsRegion },
      },
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
    });

    const sourceOutput = new codepipeline.Artifact();
    const testOutput = new codepipeline.Artifact();
    new codepipeline.Pipeline(this, 'Pipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [
            this.createSourceAction(ownerName, repositoryName, branch, sourceOutput)
          ],
        },
        {
          stageName: 'Test',
          actions: [
            this.createTestAction(infraBuild, sourceOutput, testOutput)
          ],
        },
        {
          stageName: 'Build',
          actions: [
            this.createBuildAction(infraBuild, testOutput, sourceOutput)
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            this.createDeployAction(infraBuild, sourceOutput, testOutput)
          ],
        },
      ],
    });
  }

  private createSourceAction(owner: string, repositoryName: string, branch: string, sourceOutput: codepipeline.Artifact): codepipeline_actions.GitHubSourceAction {
    const gitHubOAuthToken = ssm.StringParameter.valueForStringParameter(this, 'githubOAuthToken');

    return new codepipeline_actions.GitHubSourceAction ({
      actionName: 'Github',
      owner: owner,
      repo: repositoryName,
      branch: branch,
      oauthToken: SecretValue.plainText(gitHubOAuthToken),
      output: sourceOutput,
    });
  }

  private createTestAction(infraBuild: codebuild.PipelineProject, sourceInput: codepipeline.Artifact, sourceOutput: codepipeline.Artifact): codepipeline_actions.CodeBuildAction {
    return new codepipeline_actions.CodeBuildAction ({
      actionName: 'package',
      project: infraBuild,
      input: sourceInput,
      outputs: [sourceOutput],
    });
  }

  private createBuildAction(infraBuild: codebuild.PipelineProject, sourceInput: codepipeline.Artifact, sourceOutput: codepipeline.Artifact): codepipeline_actions.CloudFormationCreateReplaceChangeSetAction {
    const SamDeploymentRole: Role = new Role(this, 'SamRole', {
      assumedBy: new ServicePrincipal('cloudformation.amazonaws.com')
    });
    SamDeploymentRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        's3:*',
        'events:*',
        'iam:*',
        'cloudformation:*',
      ],
      resources:['*']
    }));

    return new codepipeline_actions.CloudFormationCreateReplaceChangeSetAction({
      actionName: "ChangeSetCreate",
      adminPermissions: false,
      stackName: 'infraDeploymentStack',
      changeSetName: 'InfraChangeSet',
      templatePath: sourceInput.atPath('infra-buildspec.yml')
    });
  }

  private createDeployAction(infraBuild: codebuild.PipelineProject, sourceInput: codepipeline.Artifact, sourceOutput: codepipeline.Artifact): codepipeline_actions.CloudFormationCreateUpdateStackAction {
    return new codepipeline_actions.CloudFormationCreateUpdateStackAction({
      actionName: 'Deploy',
      templatePath: sourceInput.atPath('infra-buildspec.yml'),
      stackName: 'infraDeploymentStack',
      adminPermissions: true,
      output: sourceOutput,
    });
  }
}