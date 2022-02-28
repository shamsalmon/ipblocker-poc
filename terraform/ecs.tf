locals {
  name        = "ipblock"
  environment = "dev"

  ec2_resources_name = "${local.name}-${local.environment}"
}

module "ecs" {
  source  = "terraform-aws-modules/ecs/aws"
  version = "3.4.1"

  name               = local.name
  container_insights = true

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  tags = {
    Environment = local.environment
  }
}

