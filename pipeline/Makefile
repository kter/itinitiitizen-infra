# pipeline-* ... Pipeline for other CloudFormation template (deployed by manually)
validate:
	aws cloudformation validate-template --template-body file://pipeline.yml

create:validate
	aws cloudformation create-stack --stack-name infra-pipeline-itizen \
	--template-body file://pipeline.yml \
	--capabilities CAPABILITY_IAM
update:validate
	aws cloudformation update-stack \
	--stack-name infra-pipeline-itizen \
	--template-body file://pipeline.yml \
	--capabilities CAPABILITY_IAM
delete:
	$(eval BUCKET := $(shell aws cloudformation describe-stack-resources --stack-name infra-pipeline-itizen --logical-resource-id ArtifactStoreBucket | grep PhysicalResourceId | cut -d'"' -f 4))
	python3 scripts/s3_delete.py $(BUCKET)
	aws s3 rb --force s3://$(BUCKET)
	$(eval BUCKET := $(shell aws cloudformation describe-stack-resources --stack-name infra-pipeline-itizen --logical-resource-id CodeBuildBucket | grep PhysicalResourceId | cut -d'"' -f 4))
	python3 scripts/s3_delete.py $(BUCKET)
	aws s3 rb --force s3://$(BUCKET)
	aws cloudformation delete-stack --stack-name infra-pipeline-itizen
