# ecs-* ... Pipeline for ECS (deployed by pipeline-*)
# rds-* ... Pipeline for RDS (deployed by pipeline-*)
# pipeline-* ... Pipeline for other CloudFormation template (deployed by manually)
target = ecs
validate:
	aws cloudformation validate-template --template-body file://${target}.yml

ecs-create:validate
	aws cloudformation create-stack --stack-name ecs-itizen \
	--template-body file://ecs.yml \
	--capabilities CAPABILITY_IAM \
	--parameters ParameterKey=Subnets,ParameterValue='subnet-37ac516f\,subnet-94f72ce2' \
	ParameterKey=SourceSecurityGroup,ParameterValue=sg-04ce930d54d7241df \
	ParameterKey=VPC,ParameterValue=vpc-cecea5aa
ecs-update:validate
	aws cloudformation update-stack \
	--stack-name ecs-itizen \
	--template-body file://ecs.yml \
	--capabilities CAPABILITY_IAM \
	--parameters ParameterKey=Subnets,ParameterValue='subnet-37ac516f\,subnet-94f72ce2' \
	ParameterKey=SourceSecurityGroup,ParameterValue=sg-04ce930d54d7241df \
	ParameterKey=VPC,ParameterValue=vpc-cecea5aa
ecs-delete:
	aws cloudformation delete-stack --stack-name ecs-itizen

rds-create:validate
	aws cloudformation create-stack --stack-name rds-itizen \
	--template-body file://rds.yml \
	--capabilities CAPABILITY_IAM \
	--parameters ParameterKey=DBName,ParameterValue=itizen \
  		ParameterKey=DBUser,ParameterValue=itizen \
  		ParameterKey=DBPassword,ParameterValue=itizen_rds_password \
  		ParameterKey=EC2SecurityGroup,ParameterValue=sg-04ce930d54d7241df \
  		ParameterKey=MultiAZ,ParameterValue=true \
		ParameterKey=VPC,ParameterValue=vpc-cecea5aa \
	    ParameterKey=Subnets,ParameterValue='subnet-37ac516f\,subnet-94f72ce2'
rds-update:validate
	aws cloudformation update-stack \
	--stack-name rds-itizen \
	--template-body file://rds.yml \
	--capabilities CAPABILITY_IAM \
	--parameters ParameterKey=DBName,ParameterValue=itizen \
  		ParameterKey=DBUser,ParameterValue=itizen \
  		ParameterKey=DBPassword,ParameterValue=itizen_rds_password \
  		ParameterKey=EC2SecurityGroup,ParameterValue=sg-04ce930d54d7241df \
  		ParameterKey=MultiAZ,ParameterValue=true \
		ParameterKey=VPC,ParameterValue=vpc-cecea5aa \
	    ParameterKey=Subnets,ParameterValue='subnet-37ac516f\,subnet-94f72ce2'
rds-delete:
	aws cloudformation delete-stack --stack-name rds-itizen

pipeline-create:validate
	aws cloudformation create-stack --stack-name infra-itizen \
	--template-body file://pipeline.yml \
	--capabilities CAPABILITY_IAM
pipeline-update:validate
	aws cloudformation update-stack \
	--stack-name infra-itizen \
	--template-body file://pipeline.yml \
	--capabilities CAPABILITY_IAM
pipeline-delete:
	aws cloudformation delete-stack --stack-name infra-itizen
