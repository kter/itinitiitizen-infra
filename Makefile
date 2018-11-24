# ecs-* ... Pipeline for ECS (deployed by pipeline-*)
# rds-* ... Pipeline for RDS (deployed by pipeline-*)
# pipeline-* ... Pipeline for other CloudFormation template (deployed by manually)
validate:
	aws cloudformation validate-template --template-body file://parent.yml

# 作成はパイプラインが行う。
delete:
	aws cloudformation delete-stack --stack-name infra-itizen-prod
