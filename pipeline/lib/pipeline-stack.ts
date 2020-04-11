import * as codebuild from '@aws-cdk/aws-codebuild';
import * as cloudformation from '@aws-cdk/aws-cloudformation';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import { App, Stack, StackProps, SecretValue } from '@aws-cdk/core';
import * as ssm from '@aws-cdk/aws-ssm';
import * as s3 from '@aws-cdk/aws-s3';
import { Role, PolicyStatement, Effect, ServicePrincipal}from '@aws-cdk/aws-iam';


// TODO: 規定の変数はないか？
const ownerName = 'kter';
const repositoryName = "itinitiitizen-infra";
const branch = 'master';
const awsRegion = 'ap-northeast-1';
const changeSetName = 'infra';

export class PipelineStack extends Stack {
  constructor(app: App, id: string, props?: StackProps) {
    super(app, id, props);

    const s3BucketName = `itinitiitizen-infra-artifact-${this.stackName}`.toLowerCase();
    const s3Bucket = new s3.Bucket(
        this,
        s3BucketName,
        {
          bucketName: s3BucketName
        }
    );

    const infraBuild = new codebuild.PipelineProject(this, 'infraBuild', {
      buildSpec: codebuild.BuildSpec.fromSourceFilename('infra-buildspec.yml'),
      environmentVariables: {
        AWS_REGION: { value: awsRegion },
        S3_BUCKET: { value: s3BucketName },
      },
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_2_0,
      },
    });

    infraBuild.addToRolePolicy(new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            'cloudformation:ValidateTemplate',
          ],
          resources:['*']
        }
    ));

    // const CodeBuildRole: Role = new Role(
    //     this,
    //     'CodeBuildRole',
    //     {
    //       assumedBy: new ServicePrincipal('codebuild.amazonaws.com')
    //     }
    // );

    // // CodeBuildRole.addToPolicy(new PolicyStatement({
    // //   effect: Effect.ALLOW,
    // //   actions: [
    // //     'logs:CreateLogGroup',
    // //     'logs:CreateLogStream',
    // //     'logs:PutLogEvents',
    // //   ],
    // //   resources:[`arn:aws:logs:${region}:${accountId}:log-group:/aws/codebuild/*`]
    // // }));
    infraBuild.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:GetObject',
        's3:GetObjectVersion',
      ],
      resources:[
        `arn:aws:s3:::${s3BucketName}`,
        `arn:aws:s3:::${s3BucketName}/*`
      ]
    }));

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
    const gitHubOAuthToken = ssm.StringParameter.valueForStringParameter(this, 'github_token_codepipeline');

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

    return new codepipeline_actions.CloudFormationCreateReplaceChangeSetAction({
      actionName: "ChangeSetCreate",
      adminPermissions: false,
      stackName: 'infraDeploymentStack',
      changeSetName: 'InfraChangeSet',
      templatePath: sourceInput.atPath('packaged.yml'),
      templateConfiguration: sourceInput.atPath('param.prod.json')
    });
  }

  private createDeployAction(infraBuild: codebuild.PipelineProject, sourceInput: codepipeline.Artifact, sourceOutput: codepipeline.Artifact): codepipeline_actions.CloudFormationExecuteChangeSetAction {
    return new codepipeline_actions.CloudFormationExecuteChangeSetAction({
      changeSetName: "InfraChangeSet",
      actionName: 'Deploy',
      stackName: 'infraDeploymentStack'
    });
  }
}