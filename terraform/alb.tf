resource "aws_lb_target_group" "ipblock" {
  name        = "ipblock"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = module.vpc.vpc_id


  health_check {
    enabled  = true
    path     = "/health"
    timeout  = 10
    interval = 60
  }

  depends_on = [aws_alb.ipblock]
}

resource "aws_alb" "ipblock" {
  name               = "ipblock-api-lb"
  internal           = false
  load_balancer_type = "application"

  subnets = module.vpc.public_subnets

  security_groups = [
    aws_security_group.http.id,
    aws_security_group.https.id,
    aws_security_group.egress_all.id,
  ]

}

resource "aws_alb_listener" "ipblock_http" {
  load_balancer_arn = aws_alb.ipblock.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ipblock.arn
  }
}
