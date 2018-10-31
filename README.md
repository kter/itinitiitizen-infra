# Itizen Infra

Managing Infra of Itizen.

# Build

## pipeline

Pipeline of other CloudFormation (RDS, ECS).

```
cd pipeline
make pipeline-create
```

## Infra

Infra of Itizen.

Automaticaly build Infra by CodePipeline triggered event of GitHub Repository.