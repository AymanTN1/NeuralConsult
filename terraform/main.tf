# =====================================================================
# 🛠️ TERRAFORM IAC - AWS EKS (KUBERNETES CLUSTER) PROVISIONING
# =====================================================================
# This file declares the VPC network, subnets, and the managed EKS
# cluster with autoscale worker nodes.

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# 1. VPC Network Configuration for secure isolated routing
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "neuralconsult-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["eu-north-1a", "eu-north-1b", "eu-north-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# 2. AWS Elastic Kubernetes Service (EKS) Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "neuralconsult-eks-cluster"
  cluster_version = "1.28"

  cluster_endpoint_public_access = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    general_nodes = {
      min_size     = 2
      max_size     = 5
      desired_size = 3

      instance_types = ["t3.xlarge"] # Large instance for Spring + Python NLP processing
      capacity_type  = "ON_DEMAND"
    }
  }
}

# Variables Definitions
variable "aws_region" {
  description = "AWS Cloud deployment region"
  type        = string
  default     = "eu-north-1"
}

# Outputs to use for local kubeconfig setup
output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  value = module.eks.cluster_security_group_id
}

output "cluster_name" {
  value = module.eks.cluster_name
}
