# How it Works

There are two CloudFormation.

* Building CodePipeline that build all resources for run itizen.
* Building all resources for run itizen.

First of CloudFormation builds CodePipeline. This CodePipeline builds itizen's resources triggered by THIS repository's push.
So you only have to create First of CloudFormation. Second of CloudFormation build automaticaly by CodePipeline that you build first of CloudFormation.

# How to Setup

First of all, app CodePipeline should create from CloudFormation located itinitiitizen app repository.
This pushes Docker container image required subsequent procedures.

Before setting up, You might to set `AWS_DEFAULT_PROFILE=(PROFILE_NAME)`.

```
export AWS_DEFAULT_PROFILE=(YOUR AWS PROFILE NAME HERE)
```

## Create CodePipeline

```bash
cd pipeline
make create
```

## Create Resources

Automaticaly starting build due to you created CodePipeline previous step.
If you need update resources, you need to edit the files, and push it.
