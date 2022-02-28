resource "aws_cloudwatch_log_group" "ipblock" {
  name              = "ipblock"
  retention_in_days = 1
}

resource "aws_ecs_task_definition" "ipblock" {
  family                   = "ipblock1"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_role.arn
  memory                   = 2048
  cpu                      = 1024
  container_definitions    = <<EOF
[
  {
    "name": "ipblocker",
    "image": "sjs344/ipblocker:1.1",
    "cpu": 1024,
    "memory": 2048,
    "portMappings" : [
      {
        "containerPort" : 3000
      }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-region": "us-east-1",
        "awslogs-group": "ipblock",
        "awslogs-stream-prefix": "fluenstream"
      }
    }
  }
]
EOF
}

resource "aws_ecs_service" "ipblock" {
  name            = "ipblock"
  cluster         = module.ecs.ecs_cluster_id
  task_definition = aws_ecs_task_definition.ipblock.arn

  desired_count                      = 2
  deployment_maximum_percent         = 100
  deployment_minimum_healthy_percent = 0
  launch_type                        = "FARGATE"
  health_check_grace_period_seconds  = 60

  load_balancer {
    target_group_arn = aws_lb_target_group.ipblock.arn
    container_name   = "ipblocker"
    container_port   = "3000"
  }

  network_configuration {
    security_groups = [
      aws_security_group.egress_all.id,
      aws_security_group.ingress_api.id,
    ]
    subnets = module.vpc.private_subnets
  }
}
