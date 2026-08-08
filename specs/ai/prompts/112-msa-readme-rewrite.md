# MSA README Rewrite — Prompt Record

Date: 2026-08-08

## Actual user instructions

> Write the README according to the msa2026 requirements.

The user then supplied the deployment address:

> https://kiwimpact-app-production.up.railway.app/

The user later supplied `/Users/zephyr/Downloads/Kiwimpact_README_final.md` and
asked:

> This was written by ChatGPT — which one is better? If there is anything worth absorbing to improve ours, use it; if not, never mind.

The user then requested a deeper Gamification-theme explanation:

> Add my ideas into ## How Kiwimpact meets the Gamification theme. I believe gamification has two aspects. One is the outer layer, that is, the presentation layer — the game system, UI, animation, music, and game mechanics — which users can see directly. The second is the inner layer, that is, the core layer — what the game industry calls the game loop. It includes the user-behaviour loop, the game-economy loop, and so on. Kiwimpact not only pursues the outer layer so users feel it is like a game; at its core it also borrows from what makes games engaging — the core that drives players to participate frequently and achieve high retention. Next we will explain these one by one. Then continue with the content that is already explained. In the existing explanation, the loop part is fairly good — you can expand it appropriately based on what I said above; we explained how we do it, and we can add why we do it. As for the outer layer, I have not seen much content so far — you need to rewrite this part properly based on our current project.

The user then requested that the original Shop decision be explained:

> Add these sentences at an appropriate place: the original design planned to include a shop to motivate users to do quests and personalise their appearance, but after weighing the time (and that reason we discussed many times before), we did not want users to focus only on virtual currency, or even farm coins — we want users to stay closely focused on the goal of real-world environmental protection and contributing to the environment and the community. After careful repeated consideration, we postponed this design to a later stage.

The user then requested a concise personal-experience and audience rationale:

> Further refine the part from just now — just add and modify a few sentences: 1. Change the first sentence "I think" to: objectively summarised and analysed from my past ten years of experience as a game designer and product manager. 2. Then, in this How Kiwimpact meets the Gamification theme section, still emphasise that although I have made many casual games before, considering our market audience this time (ages from XX to XX), I did not mechanically copy my previous experience, and also decided not to adopt a childish UI style, so that our broad and wide-ranging audience can all like it and learn to use it. My personal judgement is that usability, practicality, and functionality take far higher priority than gamification. Therefore I ultimately chose the current balanced, well-considered UI style. Add the above content at an appropriate place — it does not have to be one whole large paragraph. The purpose is to optimise and supplement how the current How Kiwimpact meets the Gamification theme section is expressed.

## Implementation contract derived from accepted repository requirements

Rewrite the root README so it satisfies the accepted MSA 2026 README contract
in `.clinerules/09-msa-assessment.md` without claiming behavior that is not
supported by source, tests, evidence, or a fresh observation. Include:

- the project introduction and Gamification-theme explanation;
- distinctive implemented features;
- a clearly labelled advanced-requirements checklist;
- exactly three requirements in `Top 3 Advanced Requirements for Assessment`;
- at least two explained security controls if Security Measures is selected;
- deployed application, Scalar, repository, and video status;
- technology, local setup, verification, configuration, and AI evidence;
- a self-reflection and honest remaining submission work.

Verify the user-provided public deployment before representing it as reachable.
Do not invent a submission-video link or unobserved production behavior.

Compare the supplied alternative with the evidence-backed README. Absorb only
material improvements that remain consistent with accepted MSA decisions and
observed implementation; do not copy placeholders, unsupported claims, or an
advanced-requirement selection that contradicts the accepted Top 3 boundary.

Rewrite the Gamification section around the user's two-layer model. Ground the
outer layer in implemented UI, visual identity, visible mechanics, reward
animation, themes, accessibility, and the deliberate absence of audio. Expand
the existing action, progression/reward-economy, and community loops with why
each loop supports return participation. Preserve the user's retention insight
while framing it as ethical sustained engagement rather than intentionally
addictive or compulsive design.

Add the product owner's Shop trade-off to the progression/reward-economy
discussion. Explain that the original currency/Shop concept supported Quest
motivation and personalisation, but was deferred because a safe transactional
economy would consume disproportionate implementation and verification time and
could shift motivation toward currency farming rather than real environmental
and community contribution. Preserve the achievement-unlocked, non-economic
cosmetics as the current compromise and describe a Shop as a future option that
requires a separate economy/security/test design.

Refine the Gamification introduction with the product owner's ten years of game
design and product-management experience. Explain that previous casual-game
patterns were not copied mechanically because Kiwimpact serves the accepted
broad audience from younger users through adults around 60. State that
usability, practical value, and functional clarity take priority over visible
gamification, and present the current non-childish eco-adventure UI as a
deliberate balance. Do not invent an unsupported exact minimum age.
