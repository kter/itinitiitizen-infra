# pipeline-* ... Pipeline for other CloudFormation template (deployed by manually)
validate:
	aws cloudformation validate-template --template-body file://pipeline.yml

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
