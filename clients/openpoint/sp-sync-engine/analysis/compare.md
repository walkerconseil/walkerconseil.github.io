## Executive Conclusion

Both are substantial integration programmes, but they solve different classes of problem.

- **OP-SP is strongest in configurable product integration:** generic field mapping, project administration, stakeholder creation, schema discovery, error administration, and flexible mapping of Social Point submissions into OpenPoint entities.
- **SP-CL is stronger in systems and data-lifecycle engineering:** cryptographic linking, credential custody, exact source authority, complete-snapshot reconciliation, canonical create/update/delete semantics, files, durable finalisation, operation recovery, and cross-repository contract enforcement.

> **SP-CL is materially larger, deeper and more technically sophisticated as an integration system.** OP-SP is broader in administrator-controlled mapping and destination modelling, but implements a simpler one-way event-ingestion lifecycle.

The accepted SP-CL implementation represents approximately **double the measured code changes** of the accepted OP-SP implementation. Including SP-CL's discarded work increases programme-level investment further. This is evidence of relative implementation scale, not a literal measure of difficulty or person-hours.

## Capability Comparison

| Capability | OP-SP | SP-CL |
|---|---|---|
| Primary purpose | Convert SP submissions into configurable OpenPoint events and stakeholders | Maintain private CL analytical representations of SP tools |
| Integration model | Event-driven, one-way ingestion | Authoritative complete-snapshot synchronisation |
| Tool families | Eight recognised | Nine accepted analytical adapters |
| Destination model | Generic OpenPoint Events and Stakeholders | Native CL projects, spaces, blocks, submissions, contacts and files |
| Field configuration | Rich administrator-defined mappings | Fixed, adapter-owned analytical schemas |
| Source updates | New submission events | Create, update, replay and authoritative removal |
| Source deletion | Not propagated | Canonical hard removal |
| Files | Not imported | Versioned transfer, replacement, retry and cleanup |
| Contacts | Configurable stakeholder resolution and creation | Adapter-policy-controlled contact reconciliation |
| Write-back to SP | No | No |
| Native SP product parity | No | Explicitly out of scope |
| Operator controls | Connection, project, tool and field mapping UI | Linking, metadata refresh, sync progress, warnings, retry and detach |
| Failure handling | Service Bus abandon/dead-letter plus failure records | Operation ledger, Graphile retries, terminalisation and durable finalisation |

## OP-SP Architecture

The modern OP-SP connector is not a simple webhook. It has a substantial OpenPoint-side service architecture:

```
SP submission
  -> SP Core listener
  -> SP API event publisher
  -> Azure Service Bus
  -> OpenPoint subscription handler
  -> tenant/project/tool resolution
  -> schema and mapping validation
  -> stakeholder resolution
  -> Event creation
  -> connector links and failure records
```

### Principal Layers

- OAuth2 client-credential exchange, token caching and refresh.
- Social Point API client, Site-to-OP tenant routing and project mapping.
- Tool and member schema ingestion with per-field mapping and default-value configuration.
- Submission-to-Event conversion, member-to-Stakeholder resolution and automatic stakeholder creation.
- Event-type resolution, Service Bus settlement policy, failure persistence and connector link-health jobs.
- GraphQL administration API and full React configuration UI.

Relevant areas include `op-core/ConsultationManager/src/MySite.API.Shared/OpenPointPlatform/`, `op-core/ConsultationManager/src/MySite.ConsultationManager.UI/react/pages/entity/PlatformIntegration/` and `sp-api/app_hive/_local/model/OpenPoint.php`.

### Its Strongest Capability

OP-SP's distinguishing feature is its **generic mapping surface**. Administrators can link SP and OP projects, select enabled tools, discover source schemas, map source fields to destination entity fields, configure defaults and fixed mappings, configure member-to-stakeholder mappings, detect changed source fields, control automatic stakeholder creation and view connector failures.

That makes OP-SP more adaptable without code changes. SP-CL deliberately does not attempt this.

### Practical Data Limitations

OP-SP recognises eight tool families, but its practical import vocabulary is narrower than that headline implies:

- Text and textarea values are supported, and single-choice values can be represented as text.
- Member attributes can be mapped.
- Multi-choice appears configurable but is skipped by the current ingestion mapper.
- Files, matrix, grid, ranking and complex structured answers are unsupported.
- Source edits and deletions are not reconciled. There is no bidirectional synchronisation.
- Standalone member-update publication is absent from current source.

Consequently, OP-SP's tool breadth is primarily **mapping breadth over common scalar fields**, rather than nine distinct source-native analytical models.

### Reliability Model

Once accepted by Azure Service Bus, the architecture provides at-least-once processing, retry, dead-lettering and OP-side idempotency. Its principal reliability gap is before Service Bus: no durable SP-side outbox was found, failed synchronous publication is not demonstrably retried later, no complete modern backfill/reconciliation process was identified, and no verified user-driven replay workflow for persisted failures or dead-lettered messages was found.

The legacy `CmCms` connector had more direct bulk/report synchronisation facilities, but belongs to a separate earlier generation.

## SP-CL Architecture

SP-CL is a multi-repository synchronisation system:

```
Signed SP launch
  -> CL verifies issuer/Site/Edge/target
  -> provider credential exchange
  -> KMS-encrypted connector
  -> project/tool catalogue
  -> complete bounded source snapshot
  -> adapter acquire/conform/plan
  -> canonical mutation kernel
  -> durable processing and file finalisation
  -> analytical CL destination
```

### Nine Accepted Adapters

Quick Poll, Form App, Visioner, Question and Answer, Budget, Social Map, Forum, Conversation, and Gather with Comments. Legacy Form is deliberately excluded. MetroQuest and unknown tools remain unsupported.

Unlike OP-SP's generic scalar mapper, each SP-CL adapter explicitly models source-native structure: Q&A question/selected-answer relationships; Visioner moderation and vote facts; Budget allocation semantics; Social Map location, category and respondent-file evidence; Forum wrapper/backing relationships; Conversation thread records; Gather story/comment hierarchy and visual files; and Form App current-definition fields and attachments.

This adapter logic shares a standard structure, but it is not simply duplicated boilerplate. The shared `acquire -> conform -> plan -> apply` boundary reduces repetition while each adapter still handles materially different identity, hierarchy, schema and warning semantics.

### Canonical Mutation Kernel

All adapters use the same canonical submission lifecycle: `insert`, `upsert`, and `reconcile`. The kernel owns native IDs and `short_id` allocation, authoritative source timestamps, source/native ownership boundaries, immediate email and location projections, counts and `data_hash`, exact-replay no-op behaviour, audit evidence, durable processing intent and canonical removal.

Relevant implementation: `server/src/app/submissions/mutation/kernel.ts` and `server/src/app/submissions/mutation/finalisation.ts`.

> **This is a major architectural distinction.**  
> OP-SP asks, "How should this event be mapped when it arrives?" SP-CL additionally asks whether the snapshot is complete, whether the source identity owns the destination record, what changed, what CL owns, what must be removed, which projections and files must change atomically, and what processing must be committed for eventual completion.

### Authoritative Removal

SP-CL's deletion path handles submission comments and activities, email and location indexes, NLP and TSV state, status and processing rows, file database associations, physical-file deletion intent, reply detachment, submission and reply counts, `data_hash`, bounded removal audit evidence and contact-project-link recomputation. OP-SP has no comparable source-of-truth removal lifecycle.

### File Lifecycle

1. Acquire the complete source snapshot.
2. Record immutable source file/version identity.
3. Stage private operation evidence.
4. Transfer files independently with bounded retry.
5. Verify limits and source ownership.
6. Apply the record and successful files through the canonical lifecycle.
7. Preserve a stale prior file if replacement fails.
8. Clean staged and removed objects durably.

Controls include maximum file count, per-file and cumulative byte limits, exact replay suppression, short-lived provider URLs, no forwarded bearer credential, no redirect chains, digest and declared-size checks, guaranteed finalisation and deterministic cleanup. This subsystem alone is more involved than OP-SP's complete submission transport.

## Security Comparison

### OP-SP

OP-SP provides sound conventional integration security: OAuth2 client credentials, encrypted secrets and access tokens, Azure federated identity or SAS for Service Bus, role and project-scope authorisation, Sentinel integration user, tenant routing, feature flags and single-retry token refresh.

However, the Service Bus namespace is the principal inbound trust boundary. No application-level signed submission envelope or strict cross-repository versioned contract was identified.

### SP-CL

1. SP Core alone holds the Ed25519 initiation seed.
2. CL verifies the domain-separated initiation signature before side effects.
3. Issuer, Site, Edge, audience, target and provider origin are pinned.
4. Provider credential issue, confirm and offboard are separately scoped.
5. CL encrypts credentials with KMS and identity-bound associated data.
6. One-time exchanges and browser handoffs are expiry- and replay-protected.
7. Core distrusts the controller's loaded project/tool and independently resolves current placement.
8. Current-user eligibility is re-authorised against that resolved project.
9. Native CL writes reject unauthorised mutation of provider-owned state.
10. Callback handling applies SSRF, DNS, IP, TLS and request-size controls.

SP-CL is materially deeper in security architecture.

## Operations Comparison

| Concern | OP-SP | SP-CL |
|---|---|---|
| Queue | Azure Service Bus + Hangfire | Graphile Worker |
| Application ledger | Failure records | Full operation state machine |
| Admission idempotency | Connector record links | Operation folding + source identity |
| Retry | Message abandon/redelivery | Job retry plus typed operator retry |
| Terminal failure | Dead-letter/failure record | Terminal operation state with warnings/failure code |
| Revision fencing | Not identified | Connector revision fencing |
| Complete source acquisition | No | Required before mutation |
| File operations | No | Separate transfer/finalise jobs |
| Detach/offboard | Configuration removal | Supported credential/marker lifecycle |
| Progress UI | Schema-ingestion progress | Phase, counts, warnings and retries |

SP-CL's operational model is more complex because synchronisation is a multi-stage operation rather than one incoming event.

## Testing and Verification

Both projects contain serious testing.

### OP-SP Strengths

OP-SP has strong OpenPoint-side unit and integration coverage for OAuth and token refresh, concurrent refresh collapse, API client error handling, schema ingestion, mapping validation, stakeholder resolution, numeric and date coercion, transaction rollback, failure settlement, deep links and health checks, GraphQL administration and React configuration workflows.

Its weaker area is the SP publisher and cross-repository contract boundary. Generic Service Bus transport is tested, but complete SP-submission-to-OP contract coverage is limited.

### SP-CL Strengths

SP-CL's verification programme covers strict schemas in TypeScript and PHP, byte-identical cross-language fixtures, boundary and one-past-boundary tests, complete-snapshot and density limits, replay idempotency, source-scope isolation, validation-before-lock ordering, transaction rollback, canonical removal, file replacement and cleanup, current-placement ambiguity, credential and callback boundaries, migration rehearsal, database concurrency, controlled real-source probes, first sync and replay for all nine adapters, and independent adversarial review.

Twelve product defects were reportedly found during controlled `cnvl-test` UAT that local validation had missed. All nine adapter families subsequently reached controlled acceptance. SP-CL has the broader cross-system verification model.

## Relative Strengths

### OP-SP Is Stronger At

- Generic administrator-defined field mapping.
- Destination flexibility.
- Stakeholder-centric CRM integration.
- Mapping UI breadth.
- Supporting changing customer configurations without source changes.
- Conventional enterprise event-integration patterns.
- Integrating SP contributions into an existing OpenPoint event model.

### SP-CL Is Stronger At

- Exact source authority and identity.
- Rich source-native analytical models.
- Update and delete reconciliation.
- Native data lifecycle integrity.
- Files and file replacement.
- Cryptographic cross-system linking.
- Credential custody and trust separation.
- Durable multi-stage operations.
- Retry and finalisation.
- Cross-language contract verification.
- Boundary-driven tests and live acceptance.
- Explicit failure semantics instead of best-effort mapping.

## Final Assessment

**Breadth:** OP-SP has greater configurable product breadth. SP-CL has greater source-domain and lifecycle breadth. ***Overall breadth advantage: SP-CL, but not overwhelmingly***. OP-SP remains more flexible for arbitrary customer mapping.

**Architectural depth, technical complexity and technical sophistication:** ***clear advantage SP-CL***. Its security boundaries, canonical mutation kernel, complete-snapshot contract, operation ledger, removal lifecycle and file finalisation introduce several layers with no OP-SP equivalent.

**Engineering effort:** ***SP-CL combined materially greater system scope, architectural depth and lifecycle complexity with a substantially shorter delivery window***. It was not simply a similar connector delivered faster. It was a larger class of integration delivered in a fraction of the elapsed time. The contrast offers one view of AI-first versus AI-assisted delivery, including the greater rewrite and refactor risk that an AI-first approach must actively manage.

## Bottom Line

OP-SP is a substantial, configurable enterprise ingestion connector. ***SP-CL is a larger synchronisation platform with deeper security, identity, reconciliation, file, operational and verification architecture.***

OP-SP's primary sophistication lies in configurable mapping and integration into OpenPoint's generic Event/Stakeholder product model. SP-CL's primary sophistication lies in proving and preserving correctness across two independently owned platforms over time: who owns each field, what constitutes a complete source snapshot, how updates and deletions reconcile, how files survive retries and replacements, how credentials and target authority are established, and how all of that is validated across languages and deployments.

On capability, design depth, technical complexity and measured engineering scope, SP-CL is materially bigger. On configurable administration and destination flexibility, OP-SP remains stronger.
