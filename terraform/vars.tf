variable "environment" {
  default = ""
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}


variable "private_subnets" {
  type = list(any)
}

variable "public_subnets" {
  type = list(any)
}

variable "region" {
  default = ""
}
