# Graph Report - stremio-web  (2026-10-30)

## Corpus Check
- 552 files · ~91,632 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 157 file(s) not represented in the graph (top: .less 148, (none) 5, .ico 1)

## Summary
- 70 nodes · 81 edges · 3 communities (2 shown, 1 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5e02515b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CustomFilters.js
- useCustomFilters.js

## God Nodes (most connected - your core abstractions)
1. `useCustomFilters()` - 6 edges
2. `CustomFilters()` - 3 edges
3. `useGenres()` - 2 edges
4. `Range()` - 2 edges
5. `load()` - 2 edges
6. `hasCriteria()` - 2 edges
7. `buildQuery()` - 2 edges
8. `toMetaItem()` - 2 edges
9. `VOTES` - 1 edges
10. `SORTS` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (3 total, 1 thin omitted)

### Community 1 - "CustomFilters.js"
Cohesion: 0.20
Nodes (6): CustomFilters(), NEXT_GENRE_STATE, Range(), SORTS, useGenres(), VOTES

### Community 2 - "useCustomFilters.js"
Cohesion: 0.36
Nodes (7): buildQuery(), DEFAULTS, hasCriteria(), load(), RANGE_KEYS, toMetaItem(), useCustomFilters()

## Knowledge Gaps
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 3 inferred relationships involving `useCustomFilters()` (e.g. with `useCustomFilters.js` and `load()`) actually correct?**
  _`useCustomFilters()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `Discover.js` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._