<!--
Sync Impact Report
- Version change: [CONSTITUTION_VERSION] (uninitialized template) → 1.0.0
- Modified principles:
  - [PRINCIPLE_1_NAME] → I. Lightweight & Real-Time Responsiveness
  - [PRINCIPLE_2_NAME] → II. Simple Monolithic Architecture
  - [PRINCIPLE_3_NAME] → III. Local-First Storage & Effortless Backup
  - [PRINCIPLE_4_NAME] → IV. Minimal Third-Party Dependencies
  - [PRINCIPLE_5_NAME] → V. Pragmatic Minimalism & English-First Standard
- Added sections:
  - Architecture & Operational Constraints
  - Development Workflow & Quality Gates
- Removed sections: None
- Follow-up TODOs: None
-->
# Internal FTU Constitution

## Core Principles

### I. Lightweight & Real-Time Responsiveness
The system MUST prioritize a minimal resource footprint and low-latency, real-time responsiveness optimized for up to 100 concurrent internal users. Features and data flows MUST be designed to deliver immediate user feedback without heavy client-side bundles or sluggish background processing.

*Rationale*: Optimizing specifically for a bounded 100-user internal scale allows the system to achieve sub-second responsiveness on modest hardware without complex horizontal scaling infrastructure.

### II. Simple Monolithic Architecture
The application MUST be architected and deployed as a single, self-contained monolith targeting internal on-premise servers. Distributed architectures, microservices, and external message brokers MUST NOT be introduced. Deployment MUST remain reproducible and executable with minimal operational steps on a single host.

*Rationale*: A unified monolith eliminates network serialization overhead, simplifies debugging, and ensures effortless deployment and maintenance by internal staff.

### III. Local-First Storage & Effortless Backup
All persistent application data MUST be stored locally on the host machine using SQLite for structured relational data and designated local filesystem directories for binary files and assets. Cloud-hosted databases or external storage clusters MUST NOT be required for core operation. The storage layout MUST support complete system backup and restoration via simple file-level copy or snapshot operations.

*Rationale*: Local SQLite and folder storage guarantee data sovereignty on internal servers and reduce backup and disaster recovery to a straightforward, reliable file copy.

### IV. Minimal Third-Party Dependencies
Third-party libraries and external packages MUST be strictly restricted. Standard library and built-in runtime capabilities MUST be used by default. A third-party dependency MAY be introduced only when it solves a complex, non-trivial problem and its footprint, security, and maintenance cost are explicitly justified. Bloated frameworks and transitive dependency trees MUST be rejected.

*Rationale*: Minimizing external dependencies reduces supply-chain risk, prevents dependency rot, keeps build and startup times fast, and preserves peak runtime performance.

### V. Pragmatic Minimalism & English-First Standard
All system designs, user interfaces, and workflows MUST adhere to a pragmatic and minimalist philosophy (YAGNI). Every screen and component MUST serve a direct functional purpose with high clarity and zero visual or architectural bloat. Furthermore, English MUST be used exclusively across the entire project, including user interface copy, source code identifiers, comments, commit messages, and technical documentation.

*Rationale*: Pragmatic minimalism maximizes developer velocity and end-user efficiency, while an English-only standard ensures consistency across code, tooling, and documentation.

## Architecture & Operational Constraints

- **Target Scale**: Engineered and tuned for up to 100 users; capacity planning and concurrency models (e.g., SQLite WAL mode) MUST align with this ceiling rather than speculative hyperscale requirements.
- **Deployment Environment**: Self-hosted internal server environment; the system MUST operate reliably on a single node without requiring external cloud services.
- **Data Persistence**: SQLite (configured for concurrent reads and serialized writes via Write-Ahead Logging) + local directory hierarchy for file storage.
- **Language Standard**: English MUST be used for all UI text, API payloads, specifications, and code artifacts.

## Development Workflow & Quality Gates

- **Dependency Gate**: Any pull request or plan introducing a new third-party package MUST document why built-in capabilities are insufficient and verify that bundle size and runtime memory remain minimal.
- **Simplicity Gate**: Proposed abstractions, background workers, or multi-layer patterns MUST be challenged against Principle II and Principle V before implementation begins.
- **Backup Verification**: Schema migrations and file-storage changes MUST preserve the ability to back up and restore the entire application state from the local data directory.

## Governance

This Constitution supersedes all other development practices and templates within the repository. All feature specifications (`/speckit-specify`), implementation plans (`/speckit-plan`), and task lists (`/speckit-tasks`) MUST verify compliance with these principles before implementation proceeds.

- **Amendment Procedure**: Any modification to these principles requires a documented rationale, an update to `.specify/memory/constitution.md`, and a corresponding semantic version bump.
- **Versioning Policy**:
  - `MAJOR`: Backward-incompatible removals or redefinitions of core architectural principles (e.g., moving away from monolithic architecture or SQLite).
  - `MINOR`: Addition of a new principle or material expansion of operational constraints.
  - `PATCH`: Wording clarifications, formatting refinements, or non-semantic fixes.
- **Compliance Review**: Every specification, plan, and code review MUST include a Constitution Check verifying adherence to monolithic simplicity, local SQLite/folder storage, minimal dependencies, real-time responsiveness for 100 users, pragmatic minimalism, and English language usage.

**Version**: 1.0.0 | **Ratified**: 2026-11-07 | **Last Amended**: 2026-11-07
