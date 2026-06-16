---
title: "Why Firecracker Beats Docker for AI Agent Sandboxing"
published: false
description: "Container escapes are not theoretical. A technical deep dive into Firecracker's security model, Docker's isolation gaps, and why microVMs are the right choice for untrusted code execution."
tags: security, ai, devops, programming
canonical_url: https://omnirun.io/blog/firecracker-vs-docker-ai-sandboxing
cover_image: 
---

*I'm building [OmniRun](https://omnirun.io), a cloud sandbox platform for AI agents. This post explains why we chose Firecracker microVMs over Docker containers for isolation.*

Docker changed how we deploy software. But it was never designed to isolate untrusted code. When your AI agent generates and executes arbitrary code, container-level isolation is not enough. Here is why Firecracker microVMs exist and how they solve the problem.

## Container Escapes Are Not Theoretical

Docker containers share the host kernel. Every container on a host makes system calls to the same kernel, and any kernel vulnerability becomes a potential escape path. This is not a design flaw -- it is how containers work. They were built for packaging and deployment, not for security isolation.

The CVE database tells the story:

- **CVE-2024-21626** -- Leaky Vessels. A runc vulnerability that allowed container escape through `/proc/self/fd` manipulation during container startup. Affected all Docker and Kubernetes deployments using runc.
- **CVE-2022-0185** -- A Linux kernel heap overflow in the filesystem context subsystem. Exploitable from inside an unprivileged container to gain root on the host. Required only `CAP_SYS_ADMIN` in a user namespace.
- **CVE-2020-15257** -- Containerd vulnerability where containers with host network access could escalate privileges to root on the host via the containerd-shim API.

These are not obscure edge cases. They affected production systems at scale. In a multi-tenant sandbox environment -- where you are running code you did not write and cannot audit -- any one of these vulnerabilities means game over for every tenant on the host.

## How Firecracker Is Different

[Firecracker](https://firecracker-microvm.github.io/) was built by Amazon specifically for multi-tenant workloads. It powers AWS Lambda and Fargate -- environments where millions of untrusted functions run on shared hardware every second. The design reflects that constraint.

### Minimal Device Model

Traditional hypervisors like QEMU emulate hundreds of devices -- USB controllers, sound cards, graphics adapters. Each emulated device is attack surface. Firecracker implements **fewer than 30 device emulations**: a virtio network device, a virtio block device, a serial console, a minimal keyboard controller, and not much else. Less code means fewer bugs means fewer escape paths.

### Hardware-Enforced Isolation via KVM

Every Firecracker microVM runs on top of KVM (Kernel-based Virtual Machine). The CPU itself enforces memory isolation between VMs using hardware virtualization extensions (VT-x on Intel, SVM on AMD). A guest VM cannot read or write memory belonging to another VM or the host -- the hardware prevents it, not software.

### Seccomp Filters

The Firecracker process itself runs with a strict seccomp profile that allows only the system calls it needs. Even if an attacker compromises the VMM (Virtual Machine Monitor), the seccomp filter blocks the system calls needed for most exploit chains.

### The Jailer

Firecracker's jailer wraps each VMM process in its own chroot, cgroup, and network namespace before it starts. This is defense in depth: even if someone escapes the VM and gets past seccomp, they land in an isolated namespace with no access to the broader system. Every layer has to be broken independently.

## Performance: Not the Trade-off You Expect

The traditional knock against VMs is that they are slow to boot and wasteful with memory. Firecracker was designed to eliminate both.

- **Boot time** -- Firecracker boots a microVM in under 125ms from a cold start. With snapshot restore (loading a pre-booted memory image), it drops to **under 250ms** including application state. That is comparable to container startup.
- **Memory overhead** -- Each microVM adds roughly 5MB of overhead for the VMM process. Firecracker uses KVM's memory ballooning to reclaim unused guest memory, so a VM allocated 512MB but using 100MB only consumes about 105MB on the host.
- **Density** -- Amazon runs thousands of Firecracker microVMs per physical host in production. The overhead per VM is low enough that density approaches container levels while maintaining full hardware isolation.

## OmniRun's Multi-Layer Isolation

OmniRun does not just run Firecracker out of the box. We layer additional isolation on top of the microVM boundary:

- **Firecracker microVM** -- Dedicated kernel, hardware isolation via KVM, minimal device model, seccomp, and jailer. This is the foundation.
- **Network namespace** -- Each sandbox gets its own virtual network interface with configurable egress rules. Sandboxes cannot discover or communicate with each other. Network policy is enforced at the host level, outside the VM.
- **LVM snapshots** -- Filesystem state is managed through LVM thin provisioning. Each sandbox starts from a clean snapshot. Changes are copy-on-write and isolated per sandbox. When a sandbox is destroyed, its snapshot is discarded.
- **blkdiscard on teardown** -- When a sandbox is killed, we run `blkdiscard` on the backing storage to zero the blocks. No data persists after sandbox destruction. The next tenant on that storage cannot recover previous data.

Each layer addresses a different attack vector. The microVM prevents kernel-level escape. The network namespace prevents lateral movement. LVM snapshots prevent filesystem contamination. blkdiscard prevents data recovery. An attacker would need to break all four layers to access another tenant's data.

## When Docker Is Fine

Docker is not a bad tool. It is a packaging and deployment tool being used as a security boundary, which it was not designed to be. There are plenty of situations where container-level isolation is sufficient:

- **Trusted, first-party code** -- If you wrote the code and control the supply chain, container escape is a lower-priority risk
- **Development environments** -- Local dev containers where security isolation is not the goal
- **Single-tenant deployments** -- If there is only one tenant on the host, there is no neighboring tenant to attack
- **Internal tooling** -- Behind a VPN with no untrusted input, the threat model is different

## When You Need Firecracker

The calculus changes when any of these are true:

- **Untrusted code** -- User-submitted scripts, LLM-generated code, third-party plugins
- **Multi-tenant** -- Multiple customers or users sharing infrastructure
- **Compliance requirements** -- SOC 2, HIPAA, or regulatory frameworks that require demonstrable isolation
- **High-value targets** -- Sandboxes that handle API keys, credentials, or sensitive data

If your AI agent can execute arbitrary code -- and most useful agents can -- then you are running untrusted code by definition. The LLM decides what to execute. You cannot audit every command before it runs. Hardware isolation is the only way to bound the blast radius.

## How OmniRun Makes Firecracker Accessible

Running Firecracker yourself is not simple. You need to manage kernel images, rootfs builds, snapshot pipelines, network configuration, jailer setup, and storage management. OmniRun wraps all of this behind a three-step API: `create` a sandbox, `run` commands, `kill` it when done. You get Firecracker-grade isolation through TypeScript, Python, or a CLI -- without managing any infrastructure. The sandbox boots in 250ms, runs your code in hardware isolation, and disappears cleanly when you are done.

---

Want to try OmniRun? [Get started free](https://omnirun.io/claim) -- 25 sandbox-hours per month, no credit card required. Hardware-isolated sandboxes that boot in 250ms.
