.PHONY: setup-deployment build deploy

DEPLOYMENT_BUCKET ?= "qwik-deployment-bucket"
STACK_NAME ?= "qwik-stack"
STATIC_BUCKET ?= "qwik-static"

setup-deployment:
	aws s3 mb s3://$(DEPLOYMENT_BUCKET)

build:
	npm run build

	mkdir -p cloudformation/dist
	aws cloudformation package \
		--template-file cloudformation/serverless.yml \
		--output-template-file cloudformation/dist/serverless.yml \
		--s3-bucket $(DEPLOYMENT_BUCKET)

deploy: build
	# As the static bucket is part of the stack, we need to check
	# that it exists before syncing our Qwik build.
	aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--no-cli-pager >/dev/null \
		&& aws s3 sync dist s3://$(STATIC_BUCKET)

	# Get CDN Domain Name from stack, defaults to empty.
	$(eval CDN_DOMAIN_NAME ?= $(shell aws cloudformation describe-stacks \
		--stack-name $(STACK_NAME) \
		--query 'Stacks[].Outputs[?OutputKey==`CdnDomainName`].OutputValue' \
		--output text \
		2>/dev/null))

	aws cloudformation deploy \
		--template-file cloudformation/dist/serverless.yml \
		--stack-name $(STACK_NAME) \
		--capabilities CAPABILITY_IAM \
		--parameter-overrides \
			StaticBucketName=$(STATIC_BUCKET)
			CdnDomainName=$(CDN_DOMAIN_NAME)

	# Again, now that we know for sure that the bucket exists.
	aws s3 sync dist s3://$(STATIC_BUCKET)
