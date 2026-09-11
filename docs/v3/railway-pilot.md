# Railway inspection-planning pilot

## Decision and current status — 2026-09-11

The next V3 acceptance target is one useful inspection-planning task with a real
railway professional. The product owner requested this sequence before copilot,
digital-twin, forecast or Bayesian value-of-information development. Those
capabilities remain deferred until an observed user problem justifies them.

The software walkthrough below uses published measurements and mapped railway
geometry. No railway operator has endorsed the geometry, participated in a user
session or confirmed an inspection outcome. Software acceptance is not evidence
that decisions are faster, safer or better. No operational alert is published.

## Reproducible candidate

The home page links to the named OSM Tehran–Mashhad railway way below, using the
COMET Varamin source. This is a candidate segment, not a verified full corridor.
Its presence and name in OSM do not establish ownership or operational status.

| Input or result | Pinned value |
| --- | --- |
| OSM identifier | `way/1093520814` |
| Asset ID | `5305bd11-6cd0-5c89-98ed-26e33ed26f12` |
| Network snapshot | 2026-09-04, source version `b540a66b-41c4-58a9-9a68-e63f5ffb226d` |
| COMET product | `5323cc4f-57ec-5347-a85d-14f4887e5d27` |
| Deformation source version | `e8588374-2191-543c-8d59-44eb777902a6` |
| Observation period | 2014-10-19 through 2026-07-31; ascending LOS |
| Published analysis | `e8e610a9-7950-5871-a087-ed70b2cbc82b`, `geodesic-midpoint-1`, experimental |
| Total and sampled valid length | 5,426.417344 m each; 100% sampled raster coverage |
| Length-weighted mean | −100.930059 mm/year, away from the satellite |
| Maximum absolute rate | 127.229736 mm/year |

These are descriptive measurements over the source period. They are not present-day
velocity, vertical subsidence, structural damage, verified network accuracy or
inspection priorities. Full sampled coverage does not mean full scientific
confidence. Source uncertainty and independent structural validation are absent.

Local entry after starting the application:

`/assets?aoi=varamin-comet&product=5323cc4f-57ec-5347-a85d-14f4887e5d27&q=way%2F1093520814`

## One task, one decision record

Ask the route owner's inspection planner to identify the first interval to
**review for a possible site visit**, or explain why the evidence is insufficient.
The owner confirms the actual asset, access constraints and decision authority
before an operational visit is proposed. The operator's existing procedures govern
closures, train operations and safety decisions.

1. Open the candidate and confirm its identity and geometry against the owner's
   records. Reject or correct a mismatch before assessing the measurement.
2. Read the observation period, LOS sign, valid and missing lengths, profile and
   source limitations. Select an interval to locate its actual geometry on the map.
3. Record the chosen interval and reason, or the additional evidence needed.
   Preserve the asset/product/analysis IDs, interval chainage and shareable URL;
   attach the existing JSON, CSV or GeoJSON export when needed.
4. Have the owner review the record. Log disagreement and uncertainty explicitly;
   do not translate the largest rate into an automatic priority or damage label.
5. After an authorized visit, record actual findings and whether the selection
   helped. Keep sensitive owner records outside the public repository.

## Formative evaluation before further features

Recruit one real inspection planner first. Agree the task and criteria before
testing. Record their existing workflow using the same available evidence, then
compare it with FORUDID on comparable, owner-approved segments. Counterbalance
task order when possible and record familiarity and assistance; repeating an
identical task creates a learning effect.

Use a simple session record; no new case-management service is required:

| Field | Record during the session |
| --- | --- |
| Participant and context | Consented role, decision responsibility, task and normal tools; no public personal details |
| Inputs | Exact source, product, asset and analysis IDs; task order and geometry approval |
| Timing | Start, end and interruptions for each workflow; time to a reviewable decision, not time to the first click |
| Correctness | Correct interval and provenance; LOS versus vertical; observation period; missing data versus zero; reviewer disagreements |
| Decision | Selected interval and reason, or justified deferral and missing evidence; assistance required |
| Outcome | Owner acceptance, actual visit findings when available, and any changed action |

Proposed formative success criterion: a reviewable result without help, no critical
interpretation errors, and either a shorter completion time or a reviewer-confirmed
improvement in the decision record. Agree a meaningful time target with the user
before measuring it. Report individual observations, including failures. One user
cannot establish generalizable decision improvement or scientific validation.

If the source resolution, dates or geometry cannot support the user's decision,
stop that use case and acquire the missing evidence or narrow the task. Do not
solve this mismatch by adding a prediction or assistant. Prioritize the next change
from observed task failure: selection, interpretation, evidence export or the
smallest owner-required workflow step.

## Evidence available now

Real-data browser checks cover the home entry, candidate identity, actual mean,
profile, selected interval, URL state and Persian/English observation dates at
desktop and mobile sizes. Native-pixel sampling and missing-data checks are
separate software checks. No participant time, user decision, owner acceptance or
field outcome has yet been measured. See the [coverage ledger](../operations/specification-coverage.md).
